import { defineStore } from "pinia"

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
        const response = await fetch(`/api/sales?${queryParams}`)
        if (!response.ok) throw new Error("Error fetching sales")
        this.sales = await response.json()
      } catch (error) {
        this.error = error.message
        console.error("Error fetching sales:", error)
      } finally {
        this.loading = false
      }
    },

    async createSale(saleData) {
      try {
        const response = await fetch("/api/sales", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(saleData),
        })

        if (!response.ok) throw new Error("Error creating sale")

        const newSale = await response.json()
        this.sales.unshift(newSale)
        return newSale
      } catch (error) {
        this.error = error.message
        throw error
      }
    },

    async updateSale(id, saleData) {
      try {
        const response = await fetch(`/api/sales/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(saleData),
        })

        if (!response.ok) throw new Error("Error updating sale")

        const updatedSale = await response.json()
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
        const response = await fetch(`/api/sales/${id}/cancel`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ reason }),
        })

        if (!response.ok) throw new Error("Error canceling sale")

        const canceledSale = await response.json()
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
        const response = await fetch(`/api/sales/${saleId}/invoice?format=${format}`)
        if (!response.ok) throw new Error("Error generating invoice")

        if (format === "pdf") {
          const blob = await response.blob()
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
        const response = await fetch(`/api/sales/report?${queryParams}`)

        if (!response.ok) throw new Error("Error generating sales report")

        return await response.json()
      } catch (error) {
        this.error = error.message
        throw error
      }
    },
  },
})
