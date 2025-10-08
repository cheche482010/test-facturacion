import { defineStore } from "pinia"
import api from "@/services/api.js"

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
        const data = await api.get("/products")
        this.products = data
      } catch (error) {
        this.error = error.message
        console.error("Error fetching products:", error)
      } finally {
        this.loading = false
      }
    },

    async createProduct(productData) {
      try {
        const newProduct = await api.post("/products", productData)
        this.products.push(newProduct)
        return newProduct
      } catch (error) {
        this.error = error.message
        throw error
      }
    },

    async updateProduct(id, productData) {
      try {
        const updatedProduct = await api.put(`/products/${id}`, productData)
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
        await api.delete(`/products/${id}`)
        this.products = this.products.filter((p) => p.id !== id)
      } catch (error) {
        this.error = error.message
        throw error
      }
    },

    async updateStock(productId, newStock, movementType = "ajuste") {
      try {
        await api.put(`/products/${productId}/stock`, { newStock, movementType })
        const product = this.products.find((p) => p.id === productId)
        if (product) {
          product.currentStock = newStock
        }
      } catch (error) {
        this.error = error.message
        throw error
      }
    },

    async uploadProductImage(productId, imageFile) {
      try {
        const formData = new FormData()
        formData.append("image", imageFile)
        // Deja que el navegador establezca el Content-Type correcto con el boundary
        const updatedProduct = await api.post(`/products/${productId}/upload-image`, formData)
        const index = this.products.findIndex((p) => p.id === productId)
        if (index !== -1) {
          this.products[index] = updatedProduct
        }
        return updatedProduct
      } catch (error) {
        this.error = error.message
        console.error("Error uploading product image:", error)
        throw error
      }
    },
  },
})
