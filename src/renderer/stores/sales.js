import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useSalesStore = defineStore('sales', () => {
  const recentSales = ref([])
  const pendingCart = ref([])
  const pendingCartStatus = ref(false)

  const hasPendingCart = computed(() => {
    return pendingCartStatus.value
  })

  const loadPendingCart = () => {
    try {
      const stored = localStorage.getItem('pendingCart')
      if (stored) {
        const parsed = JSON.parse(stored)
        const today = new Date().toDateString()
        if (parsed.date === today) {
          pendingCart.value = parsed.cart
          pendingCartStatus.value = parsed.cart.length > 0
        } else {
          pendingCart.value = []
          pendingCartStatus.value = false
          localStorage.removeItem('pendingCart')
        }
      } else {
        pendingCart.value = []
        pendingCartStatus.value = false
      }
    } catch (error) {
      console.error('Error loading pending cart:', error)
      pendingCart.value = []
      pendingCartStatus.value = false
    }
  }

  const savePendingCart = () => {
    try {
      const data = {
        cart: pendingCart.value,
        date: new Date().toDateString()
      }
      localStorage.setItem('pendingCart', JSON.stringify(data))
    } catch (error) {
      console.error('Error saving pending cart:', error)
    }
  }

  const clearPendingCart = () => {
    pendingCart.value = []
    localStorage.removeItem('pendingCart')
    pendingCartStatus.value = false
  }

  const updatePendingCart = (cart) => {
    pendingCart.value = [...cart]
    pendingCartStatus.value = cart.length > 0
    savePendingCart()
  }

  async function createSale(saleData) {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/sales`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(saleData),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      
      return result
    } catch (error) {
      console.error('Error creating sale:', error)
      throw error
    }
  }

  return {
    recentSales,
    pendingCart,
    pendingCartStatus,
    hasPendingCart,
    loadPendingCart,
    savePendingCart,
    clearPendingCart,
    updatePendingCart,
    createSale
  }
})