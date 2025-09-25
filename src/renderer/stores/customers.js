import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useCustomerStore = defineStore('customers', () => {
  const customers = ref([])

  async function fetchCustomers() {
    // This is a mock implementation. Replace with your actual API call.
    console.log('Fetching customers...')
    if (customers.value.length === 0) {
      customers.value = [
        { id: 1, name: 'Cliente General', idNumber: 'V-000000000', phone: 'N/A', address: 'N/A' },
        { id: 2, name: 'Ana Pérez', idNumber: 'V-12345678', phone: '0412-1234567', address: 'Calle Falsa 123' },
        { id: 3, name: 'Carlos Rodríguez', idNumber: 'V-87654321', phone: '0414-7654321', address: 'Avenida Siempre Viva 742' }
      ]
    }
    // In a real app:
    // const response = await window.api.getCustomers()
    // customers.value = response.data
  }

  async function createCustomer(customerData) {
    // Mock implementation
    console.log('Creating customer:', customerData)
    const newId = Math.max(0, ...customers.value.map(c => c.id)) + 1
    const newCustomer = { id: newId, ...customerData }
    customers.value.push(newCustomer)
    return newCustomer
  }

  return {
    customers,
    fetchCustomers,
    createCustomer
    // Add updateCustomer, deleteCustomer etc. as needed
  }
})