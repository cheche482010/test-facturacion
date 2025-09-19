import { defineStore } from "pinia"

export const useProductStore = defineStore("products", {
  state: () => ({
    products: [],
    loading: false,
    error: null,
  }),

  getters: {
    getProductById: (state) => (id) => {
      return state.products.find((product) => product.id === id)
    },

    getProductByCode: (state) => (code) => {
      return state.products.find((product) => product.internalCode === code || product.barcode === code)
    },

    lowStockProducts: (state) => {
      return state.products.filter((product) => product.currentStock <= product.minStock && product.currentStock > 0)
    },

    outOfStockProducts: (state) => {
      return state.products.filter((product) => product.currentStock === 0)
    },
  },

  actions: {
    async fetchProducts() {
      this.loading = true
      try {
        const response = await fetch("/api/products")
        if (!response.ok) throw new Error("Error fetching products")
        this.products = await response.json()
      } catch (error) {
        this.error = error.message
        console.error("Error fetching products:", error)
      } finally {
        this.loading = false
      }
    },

    async createProduct(productData) {
      try {
        const response = await fetch("/api/products", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(productData),
        })

        if (!response.ok) throw new Error("Error creating product")

        const newProduct = await response.json()
        this.products.push(newProduct)
        return newProduct
      } catch (error) {
        this.error = error.message
        throw error
      }
    },

    async updateProduct(id, productData) {
      try {
        const response = await fetch(`/api/products/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(productData),
        })

        if (!response.ok) throw new Error("Error updating product")

        const updatedProduct = await response.json()
        const index = this.products.findIndex((p) => p.id === id)
        if (index !== -1) {
          this.products[index] = updatedProduct
        }
        return updatedProduct
      } catch (error) {
        this.error = error.message
        throw error
      }
    },

    async deleteProduct(id) {
      try {
        const response = await fetch(`/api/products/${id}`, {
          method: "DELETE",
        })

        if (!response.ok) throw new Error("Error deleting product")

        this.products = this.products.filter((p) => p.id !== id)
      } catch (error) {
        this.error = error.message
        throw error
      }
    },

    async updateStock(productId, newStock, movementType = "ajuste") {
      try {
        const response = await fetch(`/api/products/${productId}/stock`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            newStock,
            movementType,
          }),
        })

        if (!response.ok) throw new Error("Error updating stock")

        const product = this.products.find((p) => p.id === productId)
        if (product) {
          product.currentStock = newStock
        }
      } catch (error) {
        this.error = error.message
        throw error
      }
    },
  },
})
