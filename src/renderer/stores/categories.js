import { defineStore } from "pinia"
import api from "@/services/api"

export const useCategoryStore = defineStore("categories", {
  state: () => ({
    categories: [],
    loading: false,
    error: null,
  }),

  getters: {
    getCategoryById: (state) => (id) => {
      return state.categories.find((category) => category.id === id)
    },

    rootCategories: (state) => {
      return state.categories.filter((category) => !category.parentId)
    },

    getSubcategories: (state) => (parentId) => {
      return state.categories.filter((category) => category.parentId === parentId)
    },
  },

  actions: {
    async fetchCategories() {
      this.loading = true
      try {
        this.categories = await api.get("/categories")
      } catch (error) {
        this.error = error.message
        console.error("Error fetching categories:", error)
      } finally {
        this.loading = false
      }
    },

    async createCategory(categoryData) {
      try {
        const newCategory = await api.post("/categories", categoryData)
        this.categories.push(newCategory)
        return newCategory
      } catch (error) {
        this.error = error.message
        throw error
      }
    },

    async updateCategory(id, categoryData) {
      try {
        const updatedCategory = await api.put(`/categories/${id}`, categoryData)
        const index = this.categories.findIndex((c) => c.id === id)
        if (index !== -1) {
          this.categories[index] = updatedCategory
        }
        return updatedCategory
      } catch (error) {
        this.error = error.message
        throw error
      }
    },

    async deleteCategory(id) {
      try {
        await api.delete(`/categories/${id}`)
        this.categories = this.categories.filter((c) => c.id !== id)
      } catch (error) {
        this.error = error.message
        throw error
      }
    },
  },
})
