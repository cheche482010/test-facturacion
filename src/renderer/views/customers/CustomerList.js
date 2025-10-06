import { ref, onMounted, computed } from 'vue'
import { useCustomerStore } from '@/stores/customers'

export default {
  name: 'CustomerList',
  setup() {
    const customerStore = useCustomerStore()

    const search = ref('')
    const dialog = ref(false)
    const editingCustomer = ref(null)

    // Filters
    const categoryFilter = ref('Todos')
    const statusFilter = ref('Todos')
    const typeFilter = ref('Todos')

    const customerForm = ref({
      id: null,
      first_name: '',
      last_name: '',
      company_name: '',
      document_type: 'CI',
      document_number: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      category: 'normal',
      credit_limit: 0,
      is_active: true,
    })

    const headers = [
      { title: 'Cliente', key: 'client', sortable: false },
      { title: 'Documento', key: 'document', sortable: true },
      { title: 'Contacto', key: 'contact', sortable: false },
      { title: 'Categoría', key: 'category', sortable: true },
      { title: 'Límite Crédito', key: 'credit_limit', sortable: true },
      { title: 'Estado', key: 'is_active', sortable: true },
      { title: 'Acciones', key: 'actions', sortable: false }
    ]

    const loadCustomers = async () => {
      await customerStore.fetchCustomers()
    }

    const openDialog = (customer = null) => {
      if (customer) {
        editingCustomer.value = customer
        // Map backend data to form
        customerForm.value = {
          id: customer.id,
          first_name: customer.first_name || '',
          last_name: customer.last_name || '',
          company_name: customer.company_name || '',
          document_type: customer.document_type,
          document_number: customer.document_number,
          email: customer.email || '',
          phone: customer.phone || '',
          address: customer.address || '',
          city: customer.city || '',
          state: customer.state || '',
          category: customer.category,
          credit_limit: customer.credit_limit,
          is_active: customer.is_active,
        }
      } else {
        editingCustomer.value = null
        customerForm.value = {
          id: null,
          first_name: '',
          last_name: '',
          company_name: '',
          document_type: 'CI',
          document_number: '',
          email: '',
          phone: '',
          address: '',
          city: '',
          state: '',
          category: 'normal',
          credit_limit: 0,
          is_active: true,
        }
      }
      dialog.value = true
    }

    const editCustomer = (customer) => {
      openDialog(customer)
    }

    const closeDialog = () => {
      dialog.value = false
    }

    const saveCustomer = async () => {
      // Basic validation
      if (!customerForm.value.document_number || (!customerForm.value.first_name && !customerForm.value.company_name)) {
        alert('Por favor, complete los campos obligatorios.')
        return
      }

      // Determine name for natural or juridical person
      const customerData = { ...customerForm.value }
      if (customerData.company_name) {
          customerData.customer_type = 'juridico'
          customerData.name = customerData.company_name
      } else {
          customerData.customer_type = 'natural'
          customerData.name = `${customerData.first_name} ${customerData.last_name}`.trim()
      }


      let success = false
      if (editingCustomer.value) {
        success = await customerStore.updateCustomer(editingCustomer.value.id, customerData)
      } else {
        success = await customerStore.createCustomer(customerData)
      }

      if (success) {
        closeDialog()
        await loadCustomers()
      } else {
        alert(customerStore.error || 'Ocurrió un error al guardar el cliente.')
      }
    }

    const deleteCustomer = async (customer) => {
      if (confirm(`¿Está seguro de que desea eliminar a ${customer.first_name || customer.company_name}?`)) {
        const success = await customerStore.deleteCustomer(customer.id)
        if (success) {
          await loadCustomers()
        } else {
          alert('Ocurrió un error al eliminar el cliente.')
        }
      }
    }

    onMounted(() => {
      loadCustomers()
    })
    
    // Computed properties for summary cards
    const totalClients = computed(() => customerStore.pagination.totalItems)
    const activeClients = computed(() => customerStore.customers.filter(c => c.is_active).length)
    const premiumClients = computed(() => customerStore.customers.filter(c => c.category === 'mayorista' || c.category === 'preferencial').length)
    const pendingBalance = computed(() => 0) // Placeholder

    const filteredCustomers = computed(() => {
      let filtered = customerStore.customers

      // Filter by category
      if (categoryFilter.value && categoryFilter.value !== 'Todos') {
        filtered = filtered.filter(c => c.category === categoryFilter.value)
      }

      // Filter by status
      if (statusFilter.value && statusFilter.value !== 'Todos') {
        const isActive = statusFilter.value === 'Activo'
        filtered = filtered.filter(c => c.is_active === isActive)
      }

      // The 'search' prop of v-data-table will handle the text search

      return filtered
    })

    return {
      customers: computed(() => customerStore.customers),
      filteredCustomers,
      loading: computed(() => customerStore.loading),
      search,
      dialog,
      editingCustomer,
      customerForm,
      headers,
      openDialog,
      editCustomer,
      closeDialog,
      saveCustomer,
      deleteCustomer,
      categoryFilter,
      statusFilter,
      typeFilter,
      totalClients,
      activeClients,
      premiumClients,
      pendingBalance,
    }
  }
}