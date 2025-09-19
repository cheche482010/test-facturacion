import { defineStore } from "pinia"

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
        const response = await fetch("/api/inventory/movements")
        if (!response.ok) throw new Error("Error fetching movements")
        this.movements = await response.json()
      } catch (error) {
        this.error = error.message
        console.error("Error fetching movements:", error)
      } finally {
        this.loading = false
      }
    },

    async fetchMovementsByProduct(productId) {
      try {
        const response = await fetch(`/api/inventory/movements/product/${productId}`)
        if (!response.ok) throw new Error("Error fetching product movements")
        const productMovements = await response.json()

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
        const response = await fetch(`/api/inventory/adjust-stock`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            productId,
            newStock,
            reason,
            notes,
          }),
        })

        if (!response.ok) throw new Error("Error adjusting stock")

        const result = await response.json()

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
        const response = await fetch(`/api/inventory/mass-adjustment`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(adjustmentData),
        })

        if (!response.ok) throw new Error("Error in mass adjustment")

        const result = await response.json()

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
        const response = await fetch("/api/inventory/movements", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(movementData),
        })

        if (!response.ok) throw new Error("Error creating movement")

        const newMovement = await response.json()
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
        const response = await fetch(`/api/inventory/report?${queryParams}`)

        if (!response.ok) throw new Error("Error generating inventory report")

        return await response.json()
      } catch (error) {
        this.error = error.message
        throw error
      }
    },

    async getStockAlerts() {
      try {
        const response = await fetch("/api/inventory/alerts")
        if (!response.ok) throw new Error("Error fetching stock alerts")

        this.alerts = await response.json()
        return this.alerts
      } catch (error) {
        this.error = error.message
        throw error
      }
    },
  },
})
