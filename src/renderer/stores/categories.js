import { defineStore } from "pinia"

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
        const response = await fetch("/api/categories")
        if (!response.ok) throw new Error("Error fetching categories")
        this.categories = await response.json()
      } catch (error) {
        this.error = error.message
        console.error("Error fetching categories:", error)
      } finally {
        this.loading = false
      }
    },

    async createCategory(categoryData) {
      try {
        const response = await fetch("/api/categories", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(categoryData),
        })

        if (!response.ok) throw new Error("Error creating category")

        const newCategory = await response.json()
        this.categories.push(newCategory)
        return newCategory
      } catch (error) {
        this.error = error.message
        throw error
      }
    },

    async updateCategory(id, categoryData) {
      try {
        const response = await fetch(`/api/categories/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(categoryData),
        })

        if (!response.ok) throw new Error("Error updating category")

        const updatedCategory = await response.json()
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
        const response = await fetch(`/api/categories/${id}`, {
          method: "DELETE",
        })

        if (!response.ok) throw new Error("Error deleting category")

        this.categories = this.categories.filter((c) => c.id !== id)
      } catch (error) {
        this.error = error.message
        throw error
      }
    },
  },
})
