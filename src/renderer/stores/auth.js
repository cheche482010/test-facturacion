import { defineStore } from "pinia"

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
        supervisor: ["sales", "inventory", "reports", "customers"],
        cashier: ["sales"],
      }

      const userPermissions = rolePermissions[state.user?.role] || []
      return userPermissions.includes("all") || userPermissions.includes(permission)
    },
  },

  actions: {
    async login(credentials) {
      try {
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(credentials),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.message || "Error de autenticación")
        }

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
        await fetch("/api/auth/logout", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.token}`,
          },
        })
      } catch (error) {
        console.error("Error during logout:", error)
      } finally {
        this.user = null
        this.token = null
        this.isAuthenticated = false
        localStorage.removeItem("token")
      }
    },

    async checkAuth() {
      if (!this.token) return false

      try {
        const response = await fetch("/api/auth/me", {
          headers: {
            Authorization: `Bearer ${this.token}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          this.user = data.user
          this.isAuthenticated = true
          return true
        } else {
          this.logout()
          return false
        }
      } catch (error) {
        this.logout()
        return false
      }
    },

    async changePassword(currentPassword, newPassword) {
      try {
        const response = await fetch("/api/auth/change-password", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.token}`,
          },
          body: JSON.stringify({
            currentPassword,
            newPassword,
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.message || "Error al cambiar contraseña")
        }

        return data
      } catch (error) {
        throw error
      }
    },
  },
})
