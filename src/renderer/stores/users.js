import { defineStore } from "pinia"
import api from "@/services/api"

export const useUsersStore = defineStore("users", {
  state: () => ({
    users: [],
  }),

  actions: {
    async fetchUsers() {
      try {
        const data = await api.get("/users")
        this.users = data.users
        return data
      } catch (error) {
        throw error
      }
    },

    async createUser(userData) {
      try {
        const data = await api.post("/users", userData)
        this.users.push(data.user)
        return data
      } catch (error) {
        throw error
      }
    },

    async updateUser(userId, userData) {
      try {
        const data = await api.put(`/users/${userId}`, userData)
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
        await api.delete(`/users/${userId}`)
        this.users = this.users.filter((u) => u.id !== userId)
      } catch (error) {
        throw error
      }
    },
  },
})
