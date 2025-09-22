import { defineStore } from "pinia"
import api from "@/services/api.js"

export const useSalesStore = defineStore("sales", {
  state: () => ({
    sales: [],
    currentSale: null,
    loading: false,
    error: null,
  }),

  getters: {
    getSaleById: (state) => (id) => {
      return state.sales.find((sale) => sale.id === id)
    },

    todaySales: (state) => {
      const today = new Date().toDateString()
      return state.sales.filter((sale) => new Date(sale.saleDate).toDateString() === today)
    },

    todayTotal: (state) => {
      const today = new Date().toDateString()
      return state.sales
        .filter((sale) => new Date(sale.saleDate).toDateString() === today)
        .reduce((sum, sale) => sum + sale.total, 0)
    },

    salesByDateRange: (state) => (startDate, endDate) => {
      return state.sales.filter((sale) => {
        const saleDate = new Date(sale.saleDate)
        return saleDate >= new Date(startDate) && saleDate <= new Date(endDate)
      })
    },
  },

  actions: {
    async fetchSales(filters = {}) {
      this.loading = true
      try {
        const queryParams = new URLSearchParams(filters).toString()
        const data = await api.get(`/sales?${queryParams}`)
        this.sales = data
      } catch (error) {
        this.error = error.message
        console.error("Error fetching sales:", error)
      } finally {
        this.loading = false
      }
    },

    async createSale(saleData) {
      try {
        const newSale = await api.post("/sales", saleData)
        this.sales.unshift(newSale)
        return newSale
      } catch (error) {
        this.error = error.message
        throw error
      }
    },

    async updateSale(id, saleData) {
      try {
        const updatedSale = await api.put(`/sales/${id}`, saleData)
        const index = this.sales.findIndex((s) => s.id === id)
        if (index !== -1) {
          this.sales[index] = updatedSale
        }
        return updatedSale
      } catch (error) {
        this.error = error.message
        throw error
      }
    },

    async cancelSale(id, reason) {
      try {
        const canceledSale = await api.put(`/sales/${id}/cancel`, { reason })
        const index = this.sales.findIndex((s) => s.id === id)
        if (index !== -1) {
          this.sales[index] = canceledSale
        }
        return canceledSale
      } catch (error) {
        this.error = error.message
        throw error
      }
    },

    async generateInvoice(saleId, format = "pdf") {
      try {
        // Nuestro servicio api.js ahora maneja esto. No necesitamos opciones especiales aquí.
        const response = await api.get(`/sales/${saleId}/invoice?format=${format}`)

        if (format === "pdf") {
          const blob = await response.blob() // Convertimos la respuesta a blob
          const url = window.URL.createObjectURL(blob)
          const a = document.createElement("a")
          a.href = url
          a.download = `factura_${saleId}.pdf`
          a.click()
        } else {
          return await response.json()
        }
      } catch (error) {
        this.error = error.message
        throw error
      }
    },

    async getSalesReport(filters = {}) {
      try {
        const queryParams = new URLSearchParams(filters).toString()
        const data = await api.get(`/sales/report?${queryParams}`)
        return data
      } catch (error) {
        this.error = error.message
        throw error
      }
    },
  },
})
