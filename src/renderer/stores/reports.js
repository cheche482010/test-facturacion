import { defineStore } from "pinia"
import api from "@/services/api.js"

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
        const data = await api.get("/reports/dashboard")
        this.dashboardData = data
        return data
      } catch (error) {
        throw error
      }
    },

    async fetchSalesReport(params) {
      try {
        const queryParams = new URLSearchParams(params)
        const data = await api.get(`/reports/sales?${queryParams}`)
        this.salesReports = data
        return data
      } catch (error) {
        throw error
      }
    },

    async fetchProductReport(params) {
      try {
        const queryParams = new URLSearchParams(params)
        const data = await api.get(`/reports/products?${queryParams}`)
        this.productReports = data
        return data
      } catch (error) {
        throw error
      }
    },

    async fetchInventoryReport(params) {
      try {
        const queryParams = new URLSearchParams(params)
        const data = await api.get(`/reports/inventory?${queryParams}`)
        this.inventoryReports = data
        return data
      } catch (error) {
        throw error
      }
    },

    async fetchFinancialReport(params) {
      try {
        const queryParams = new URLSearchParams(params)
        const data = await api.get(`/reports/financial?${queryParams}`)
        this.financialReports = data
        return data
      } catch (error) {
        throw error
      }
    },

    async fetchUserReport(params) {
      try {
        const queryParams = new URLSearchParams(params)
        const data = await api.get(`/reports/users?${queryParams}`)
        this.userReports = data
        return data
      } catch (error) {
        throw error
      }
    },
  },
})
