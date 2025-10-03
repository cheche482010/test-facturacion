import { ref, onMounted } from 'vue'

export default {
  name: 'CustomerList',
  setup() {
    const customers = ref([])
    const loading = ref(false)
    const search = ref('')
    const dialog = ref(false)
    const editingCustomer = ref(null)

    const customerForm = ref({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      country: ''
    })

    const headers = [
      { text: 'Nombre', value: 'firstName' },
      { text: 'Apellido', value: 'lastName' },
      { text: 'Email', value: 'email' },
      { text: 'Teléfono', value: 'phone' },
      { text: 'Ciudad', value: 'city' },
      { text: 'Acciones', value: 'actions', sortable: false }
    ]

    const loadCustomers = async () => {
      loading.value = true
      try {
        const response = await window.electronAPI.invoke('get-customers')
        customers.value = response
      } catch (error) {
        console.error('Error loading customers:', error)
      } finally {
        loading.value = false
      }
    }

    const openDialog = () => {
      editingCustomer.value = null
      customerForm.value = {
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        country: ''
      }
      dialog.value = true
    }

    const editCustomer = (customer) => {
      editingCustomer.value = customer
      customerForm.value = { ...customer }
      dialog.value = true
    }

    const closeDialog = () => {
      dialog.value = false
      editingCustomer.value = null
    }

    const saveCustomer = async () => {
      try {
        if (editingCustomer.value) {
          await window.electronAPI.invoke('update-customer', {
            id: editingCustomer.value.id,
            ...customerForm.value
          })
        } else {
          await window.electronAPI.invoke('create-customer', customerForm.value)
        }
        await loadCustomers()
        closeDialog()
      } catch (error) {
        console.error('Error saving customer:', error)
      }
    }

    const deleteCustomer = async (customer) => {
      if (confirm('¿Está seguro de que desea eliminar este cliente?')) {
        try {
          await window.electronAPI.invoke('delete-customer', customer.id)
          await loadCustomers()
        } catch (error) {
          console.error('Error deleting customer:', error)
        }
      }
    }

    onMounted(() => {
      loadCustomers()
    })

    return {
      customers,
      loading,
      search,
      dialog,
      editingCustomer,
      customerForm,
      headers,
      openDialog,
      editCustomer,
      closeDialog,
      saveCustomer,
      deleteCustomer
    }
  }
}