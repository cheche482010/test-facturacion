import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useSaleStore = defineStore('sales', () => {
  const recentSales = ref([])

  async function createSale(saleData) {
    // This is a mock implementation. Replace with your actual API call.
    console.log('Creating sale:', saleData)
    const newId = Math.max(0, ...recentSales.value.map(s => s.id)) + 1
    const newSale = { id: newId, date: new Date().toISOString(), ...saleData }
    recentSales.value.unshift(newSale) // Add to the beginning of the list
    return newSale
  }

  return {
    recentSales,
    createSale
  }
})