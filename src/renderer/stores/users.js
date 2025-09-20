import { defineStore } from "pinia"

export const useUsersStore = defineStore("users", {
  state: () => ({
    users: [],
  }),

  actions: {
    async fetchUsers() {
      try {
        const response = await fetch("/api/users", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        })

        if (!response.ok) {
          throw new Error("Error al cargar usuarios")
        }

        const data = await response.json()
        this.users = data.users
        return data
      } catch (error) {
        throw error
      }
    },

    async createUser(userData) {
      try {
        const response = await fetch("/api/users", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify(userData),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.message || "Error al crear usuario")
        }

        this.users.push(data.user)
        return data
      } catch (error) {
        throw error
      }
    },

    async updateUser(userId, userData) {
      try {
        const response = await fetch(`/api/users/${userId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify(userData),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.message || "Error al actualizar usuario")
        }

        const index = this.users.findIndex((u) => u.id === userId)
        if (index !== -1) {
          this.users[index] = data.user
        }

        return data
      } catch (error) {
        throw error
      }
    },

    async deleteUser(userId) {
      try {
        const response = await fetch(`/api/users/${userId}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        })

        if (!response.ok) {
          throw new Error("Error al eliminar usuario")
        }

        this.users = this.users.filter((u) => u.id !== userId)
      } catch (error) {
        throw error
      }
    },
  },
})
