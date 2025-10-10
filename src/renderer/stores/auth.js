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
    userRole: (state) => state.user?.role,
    isDev: (state) => state.user?.role === 'dev',
    isAdministrador: (state) => state.user?.role === 'administrador',
    isCajero: (state) => state.user?.role === 'cajero',
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
