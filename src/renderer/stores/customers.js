import { defineStore } from 'pinia'
import api from '../services/api'

export const useCustomerStore = defineStore('customers', {
  state: () => ({
    customers: [],
    customer: null,
    loading: false,
    error: null,
    pagination: {
      page: 1,
      itemsPerPage: 15,
      totalItems: 0,
    },
  }),

  actions: {
    async fetchCustomers(options = {}) {
      this.loading = true
      this.error = null
      try {
        const response = await api.get('/customers', {
          params: {
            page: options.page || this.pagination.page,
            limit: options.itemsPerPage || this.pagination.itemsPerPage,
            sortBy: options.sortBy?.[0]?.key,
            sortOrder: options.sortBy?.[0]?.order,
            search: options.search,
          },
        })
        this.customers = response.customers
        this.pagination.totalItems = response.totalItems
      } catch (error) {
        this.error = 'Error al cargar los clientes'
        console.error(error)
      } finally {
        this.loading = false
      }
    },

    async fetchCustomerById(id) {
      this.loading = true
      this.error = null
      try {
        const response = await api.get(`/customers/${id}`)
        this.customer = response
        return response
      } catch (error) {
        this.error = 'Error al cargar el cliente'
        console.error(error)
        return null
      } finally {
        this.loading = false
      }
    },

    async createCustomer(customerData) {
      this.loading = true
      this.error = null
      try {
        const response = await api.post('/customers', customerData)
        this.customers.push(response)
        await this.fetchCustomers() // Refresh list
        return true
      } catch (error) {
        this.error = error.response?.data?.error || 'Error al crear el cliente'
        console.error(error)
        return false
      } finally {
        this.loading = false
      }
    },

    async updateCustomer(id, customerData) {
      this.loading = true
      this.error = null
      try {
        const response = await api.put(`/customers/${id}`, customerData)
        const index = this.customers.findIndex(c => c.id === id)
        if (index !== -1) {
          this.customers[index] = response
        }
        await this.fetchCustomers() // Refresh list
        return true
      } catch (error) {
        this.error = error.response?.data?.error || 'Error al actualizar el cliente'
        console.error(error)
        return false
      } finally {
        this.loading = false
      }
    },

    async deleteCustomer(id) {
      this.loading = true
      this.error = null
      try {
        await api.delete(`/customers/${id}`)
        this.customers = this.customers.filter(c => c.id !== id)
        await this.fetchCustomers() // Refresh list
        return true
      } catch (error) {
        this.error = 'Error al eliminar el cliente'
        console.error(error)
        return false
      } finally {
        this.loading = false
      }
    },

    async searchCustomers(query) {
      if (!query) return []
      try {
        // Re-route search to the main endpoint with search parameter
        const response = await api.get('/customers', { params: { search: query, limit: 10 } })
        return response.customers
      } catch (error) {
        console.error('Error buscando clientes:', error)
        return []
      }
    },
  },
})
