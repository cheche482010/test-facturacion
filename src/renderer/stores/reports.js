import { defineStore } from "pinia"

export const useReportsStore = defineStore("reports", {
  state: () => ({
    dashboardData: {},
    salesReports: [],
    productReports: [],
    inventoryReports: [],
    financialReports: {},
    userReports: [],
  }),

  actions: {
    async fetchDashboardData() {
      try {
        const response = await fetch("/api/reports/dashboard", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        })

        if (!response.ok) {
          throw new Error("Error al cargar datos del dashboard")
        }

        const data = await response.json()
        this.dashboardData = data
        return data
      } catch (error) {
        throw error
      }
    },

    async fetchSalesReport(params) {
      try {
        const queryParams = new URLSearchParams(params)
        const response = await fetch(`/api/reports/sales?${queryParams}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        })

        if (!response.ok) {
          throw new Error("Error al cargar reporte de ventas")
        }

        const data = await response.json()
        this.salesReports = data
        return data
      } catch (error) {
        throw error
      }
    },

    async fetchProductReport(params) {
      try {
        const queryParams = new URLSearchParams(params)
        const response = await fetch(`/api/reports/products?${queryParams}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        })

        if (!response.ok) {
          throw new Error("Error al cargar reporte de productos")
        }

        const data = await response.json()
        this.productReports = data
        return data
      } catch (error) {
        throw error
      }
    },

    async fetchInventoryReport(params) {
      try {
        const queryParams = new URLSearchParams(params)
        const response = await fetch(`/api/reports/inventory?${queryParams}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        })

        if (!response.ok) {
          throw new Error("Error al cargar reporte de inventario")
        }

        const data = await response.json()
        this.inventoryReports = data
        return data
      } catch (error) {
        throw error
      }
    },

    async fetchFinancialReport(params) {
      try {
        const queryParams = new URLSearchParams(params)
        const response = await fetch(`/api/reports/financial?${queryParams}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        })

        if (!response.ok) {
          throw new Error("Error al cargar reporte financiero")
        }

        const data = await response.json()
        this.financialReports = data
        return data
      } catch (error) {
        throw error
      }
    },

    async fetchUserReport(params) {
      try {
        const queryParams = new URLSearchParams(params)
        const response = await fetch(`/api/reports/users?${queryParams}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        })

        if (!response.ok) {
          throw new Error("Error al cargar reporte de usuarios")
        }

        const data = await response.json()
        this.userReports = data
        return data
      } catch (error) {
        throw error
      }
    },
  },
})
