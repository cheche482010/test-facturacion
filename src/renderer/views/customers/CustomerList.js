import { ref, computed, onMounted } from 'vue'
import { useCustomerStore } from '../../stores/customers'
import { formatCurrency } from '@/utils/formatters'
// We will create/use this component later
// import CustomerDialog from '../../components/customers/CustomerDialog.vue'

export default {
  // components: { CustomerDialog },
  setup() {
    const customerStore = useCustomerStore()

    // State
    const loading = ref(false)
    const search = ref('')
    const customerDialog = ref(false)
    const selectedCustomer = ref(null)
    const customerToDelete = ref(null)
    const deleteDialog = ref(false)

    // Computed Properties
    const customers = computed(() => customerStore.customers)

    const summaryCards = computed(() => {
      const allCustomers = customers.value || []
      const totalCustomers = allCustomers.length
      const activeCustomers = allCustomers.filter(c => c.status === 'activo').length
      const premiumCustomers = allCustomers.filter(c => c.category === 'Mayorista').length // Assuming 'Mayorista' is the premium category
      const pendingBalance = allCustomers.reduce((sum, c) => sum + (c.pendingBalance || 0), 0)

      return [
        { title: 'Total Clientes', value: totalCustomers, icon: 'mdi-account-group', color: 'blue-grey' },
        { title: 'Clientes Activos', value: activeCustomers, icon: 'mdi-account-check', color: 'light-green' },
        { title: 'Clientes Premium', value: premiumCustomers, icon: 'mdi-star-circle', color: 'purple' },
        { title: 'Saldo Pendiente', value: formatCurrency(pendingBalance), icon: 'mdi-cash-clock', color: 'orange' }
      ]
    })

    const filteredCustomers = computed(() => {
      let filtered = customers.value
      const searchTerm = search.value?.toLowerCase() || ''

      if (searchTerm) {
        filtered = filtered.filter(c =>
          c.name.toLowerCase().includes(searchTerm) ||
          c.idNumber.toLowerCase().includes(searchTerm) ||
          c.email.toLowerCase().includes(searchTerm)
        )
      }
      // Add other filters for category, status, type if needed
      return filtered
    })

    const headers = [
      { title: 'Cliente', key: 'name', sortable: true },
      { title: 'Documento', key: 'idNumber', sortable: true },
      { title: 'Contacto', key: 'contact', sortable: false },
      { title: 'Categoría', key: 'category', sortable: true },
      { title: 'Límite de Crédito', key: 'creditLimit', sortable: true, align: 'end' },
      { title: 'Estado', key: 'status', sortable: true },
      { title: 'Acciones', key: 'actions', sortable: false, align: 'center' }
    ]

    // Methods
    const loadCustomers = async () => {
      loading.value = true
      try {
        await customerStore.fetchCustomers()
      } catch (error) {
        console.error('Error loading customers:', error)
      } finally {
        loading.value = false
      }
    }

    const openCustomerDialog = (customer = null) => {
      selectedCustomer.value = customer
      customerDialog.value = true
       console.log("Dialog should open for customer:", customer)
    }

    const onCustomerSaved = async (customerData) => {
      try {
        if (selectedCustomer.value) {
          await customerStore.updateCustomer({ ...selectedCustomer.value, ...customerData })
        } else {
          await customerStore.createCustomer(customerData)
        }
        customerDialog.value = false
        selectedCustomer.value = null
        await loadCustomers()
      } catch (error) {
        console.error('Error saving customer:', error)
      }
    }

    const confirmDelete = (customer) => {
      customerToDelete.value = customer
      deleteDialog.value = true
    }

    const deleteCustomer = async () => {
      if (!customerToDelete.value) return
      try {
        await customerStore.deleteCustomer(customerToDelete.value.id)
        deleteDialog.value = false
        customerToDelete.value = null
        loadCustomers()
      } catch (error) {
        console.error('Error deleting customer:', error)
      }
    }

    const getCategoryColor = (category) => {
      const colors = { 'Normal': 'primary', 'Mayorista': 'accent', 'Preferencial': 'secondary' }
      return colors[category] || 'grey'
    }

    const getStatusColor = (status) => {
      return status === 'activo' ? 'success' : 'error'
    }

    const getStatusText = (status) => {
      return status === 'activo' ? 'Activo' : 'Inactivo'
    }

    // Lifecycle
    onMounted(loadCustomers)

    return {
      loading,
      search,
      customerDialog,
      selectedCustomer,
      customerToDelete,
      deleteDialog,
      customers,
      summaryCards,
      filteredCustomers,
      headers,
      openCustomerDialog,
      onCustomerSaved,
      confirmDelete,
      deleteCustomer,
      getCategoryColor,
      getStatusColor,
      getStatusText,
      formatCurrency
    }
  }
}