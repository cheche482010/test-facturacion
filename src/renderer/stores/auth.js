import { defineStore } from "pinia"
import api from "@/services/api.js"
import router from "@/router"

export const useAuthStore = defineStore("auth", {
  state: () => ({
    user: null,
    token: localStorage.getItem("token"),
    isAuthenticated: false,
  }),

  getters: {
    hasRole: (state) => (role) => {
      return state.user?.role === role
    },

    hasPermission: (state) => (permission) => {
      const rolePermissions = {
        admin: ["all"],
        supervisor: ["sales", "inventory", "reports", "products", "settings"],
        cashier: ["sales"],
      }

      const userPermissions = rolePermissions[state.user?.role] || []
      return userPermissions.includes("all") || userPermissions.includes(permission)
    },
  },

  actions: {
    async login(credentials) {
      try {
        const data = await api.post("/auth/login", credentials)

        this.token = data.token
        this.user = data.user
        this.isAuthenticated = true

        localStorage.setItem("token", data.token)

        return data
      } catch (error) {
        throw error
      }
    },

    async logout() {
      try {
        await api.post("/auth/logout")
      } catch (error) {
        console.error("Error during logout:", error)
      } finally {
        this.user = null
        this.token = null
        this.isAuthenticated = false
        localStorage.removeItem("token")
        router.push("/login")
      }
    },

    async checkAuth() {
      if (!this.token) return false

      try {
        const data = await api.get("/auth/me")
        this.user = data.user
        this.isAuthenticated = true
        return true
      } catch (error) {
        this.logout()
        return false
      }
    }
  },

  async changePassword(currentPassword, newPassword) {
    try {
      const data = await api.post("/auth/change-password", {
        currentPassword,
        newPassword,
      })

      return data
    } catch (error) {
      throw error
    }
  },
},
)
