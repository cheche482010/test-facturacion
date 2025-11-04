import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useSalesStore = defineStore('sales', () => {
  const recentSales = ref([])

  async function createSale(saleData) {
    try {
      const response = await fetch('http://localhost:3001/api/sales', {
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
      console.log('Sale created successfully:', result)
      return result
    } catch (error) {
      console.error('Error creating sale:', error)
      throw error
    }
  }

  return {
    recentSales,
    createSale
  }
})