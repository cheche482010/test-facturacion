import { defineStore } from "pinia"
import api from "@/services/api"

export const useInventoryStore = defineStore("inventory", {
  state: () => ({
    movements: [],
    loading: false,
    error: null,
    alerts: [],
  }),

  getters: {
    getMovementsByProduct: (state) => (productId) => {
      return state.movements.filter((movement) => movement.productId === productId)
    },

    recentMovements: (state) => {
      return state.movements.sort((a, b) => new Date(b.movementDate) - new Date(a.movementDate)).slice(0, 10)
    },

    movementsByDateRange: (state) => (startDate, endDate) => {
      return state.movements.filter((movement) => {
        const movementDate = new Date(movement.movementDate)
        return movementDate >= new Date(startDate) && movementDate <= new Date(endDate)
      })
    },
  },

  actions: {
    async fetchMovements() {
      this.loading = true
      try {
        this.movements = await api.get("/inventory/movements")
      } catch (error) {
        this.error = error.message
        console.error("Error fetching movements:", error)
      } finally {
        this.loading = false
      }
    },

    async fetchMovementsByProduct(productId) {
      try {
        const productMovements = await api.get(`/inventory/movements/product/${productId}`)

        // Actualizar movimientos del producto en el estado
        this.movements = this.movements.filter((m) => m.productId !== productId)
        this.movements.push(...productMovements)
      } catch (error) {
        this.error = error.message
        throw error
      }
    },

    async adjustStock(productId, newStock, reason, notes = "") {
      try {
        const result = await api.post(`/inventory/adjust-stock`, {
          productId,
          newStock,
          reason,
          notes,
        })

        // Actualizar movimientos
        this.movements.push(result.movement)

        return result
      } catch (error) {
        this.error = error.message
        throw error
      }
    },

    async massAdjustment(adjustmentData) {
      try {
        const result = await api.post(`/inventory/mass-adjustment`, adjustmentData)

        // Actualizar movimientos
        this.movements.push(...result.movements)

        return result
      } catch (error) {
        this.error = error.message
        throw error
      }
    },

    async createMovement(movementData) {
      try {
        const newMovement = await api.post("/inventory/movements", movementData)
        this.movements.push(newMovement)
        return newMovement
      } catch (error) {
        this.error = error.message
        throw error
      }
    },

    async getInventoryReport(filters = {}) {
      try {
        const queryParams = new URLSearchParams(filters).toString()
        return await api.get(`/inventory/report?${queryParams}`)
      } catch (error) {
        this.error = error.message
        throw error
      }
    },

    async getStockAlerts() {
      try {
        this.alerts = await api.get("/inventory/alerts")
        return this.alerts
      } catch (error) {
        this.error = error.message
        throw error
      }
    },
  },
})
