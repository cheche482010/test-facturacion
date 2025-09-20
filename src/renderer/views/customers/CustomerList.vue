<template>
  <div class="text-black dark:text-white">
    <!-- Header -->
    <div class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-3xl font-bold">Gestión de Clientes</h1>
        <p class="text-gray-500 dark:text-gray-400">Administra tu base de datos de clientes y su información</p>
      </div>
      <button @click="openDialog()" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center">
        <svg class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
        <span>Nuevo Cliente</span>
      </button>
    </div>

    <!-- Summary Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      <div class="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md flex items-center">
        <div class="bg-blue-500 rounded-full p-3 mr-4">
            <svg class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
        </div>
        <div>
          <p class="text-sm text-gray-500 dark:text-gray-400">Total Clientes</p>
          <p class="text-2xl font-bold">{{ summary.totalCustomers }}</p>
        </div>
      </div>
       <div class="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md flex items-center">
        <div class="bg-green-500 rounded-full p-3 mr-4">
          <svg class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </div>
        <div>
          <p class="text-sm text-gray-500 dark:text-gray-400">Clientes Activos</p>
          <p class="text-2xl font-bold">{{ summary.activeCustomers }}</p>
        </div>
      </div>
      <div class="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md flex items-center">
        <div class="bg-purple-500 rounded-full p-3 mr-4">
          <svg class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.364 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.364-1.118L2.98 9.11c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
        </div>
        <div>
          <p class="text-sm text-gray-500 dark:text-gray-400">Clientes Premium</p>
          <p class="text-2xl font-bold">{{ summary.premiumCustomers }}</p>
        </div>
      </div>
      <div class="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md flex items-center">
        <div class="bg-orange-500 rounded-full p-3 mr-4">
          <svg class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
        </div>
        <div>
          <p class="text-sm text-gray-500 dark:text-gray-400">Saldo Pendiente</p>
          <p class="text-2xl font-bold">{{ formatCurrency(summary.pendingBalance) }}</p>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-md mb-6">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <input type="text" v-model="search" placeholder="Buscar por nombre, documento o email..." class="md:col-span-2 form-input" />
        <select v-model="categoryFilter" class="form-input">
          <option :value="null">Todas las Categorías</option>
          <option v-for="cat in customerCategories" :key="cat" :value="cat">{{ cat }}</option>
        </select>
        <select v-model="statusFilter" class="form-input">
          <option :value="null">Todos los Estados</option>
          <option value="activo">Activo</option>
          <option value="inactivo">Inactivo</option>
        </select>
      </div>
    </div>

    <!-- Customers Table -->
    <div class="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden">
        <div class="p-4 border-b dark:border-slate-700">
            <h2 class="text-xl font-semibold">Lista de Clientes ({{ filteredCustomers.length }})</h2>
        </div>
      <table class="w-full text-left">
        <thead>
          <tr class="border-b dark:border-slate-700 bg-gray-50 dark:bg-slate-700/50">
            <th class="py-3 px-4 font-semibold">Cliente</th>
            <th class="py-3 px-4 font-semibold">Documento</th>
            <th class="py-3 px-4 font-semibold">Contacto</th>
            <th class="py-3 px-4 font-semibold">Categoría</th>
            <th class="py-3 px-4 font-semibold">Límite Crédito</th>
            <th class="py-3 px-4 font-semibold">Estado</th>
            <th class="py-3 px-4 font-semibold">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!filteredCustomers.length">
            <td colspan="7" class="text-center py-8 text-gray-500">No se encontraron clientes.</td>
          </tr>
          <tr v-for="customer in filteredCustomers" :key="customer.id" class="border-b dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50">
            <td class="py-3 px-4 flex items-center">
                <div class="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center mr-3">
                    <span class="font-bold text-blue-600 dark:text-blue-300">{{ customer.firstName[0] }}{{ customer.lastName[0] }}</span>
                </div>
                <div>
                    <div>{{ customer.firstName }} {{ customer.lastName }}</div>
                    <div class="text-xs text-gray-500">{{ customer.companyName }}</div>
                </div>
            </td>
            <td class="py-3 px-4">{{ customer.documentType }} {{ customer.documentNumber }}</td>
            <td class="py-3 px-4">
                <div>{{ customer.phone }}</div>
                <div class="text-xs text-gray-500">{{ customer.email }}</div>
            </td>
            <td class="py-3 px-4">
                <span class="px-2 py-1 text-xs rounded-full" :class="getCategoryClass(customer.category)">
                    {{ customer.category }}
                </span>
            </td>
            <td class="py-3 px-4">{{ formatCurrency(customer.creditLimit) }}</td>
            <td class="py-3 px-4">
              <span class="px-2 py-1 text-xs font-semibold rounded-full" :class="getStatusClass(customer.status)">
                {{ getStatusText(customer.status) }}
              </span>
            </td>
            <td class="py-3 px-4">
              <div class="flex items-center space-x-2">
                <button @click="editCustomer(customer)" class="p-1 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-full">
                    <svg class="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L16.732 3.732z" /></svg>
                </button>
                <button @click="deleteCustomerConfirmation(customer)" class="p-1 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-full">
                    <svg class="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Dialog for creating/editing customer -->
    <BaseDialog v-model="dialog">
      <template #title>{{ editingCustomer ? 'Editar Cliente' : 'Nuevo Cliente' }}</template>
      <form @submit.prevent="saveCustomer" class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="form-label">Nombre *</label>
            <input type="text" v-model="customerForm.firstName" class="form-input" required />
          </div>
          <div>
            <label class="form-label">Apellido *</label>
            <input type="text" v-model="customerForm.lastName" class="form-input" required />
          </div>
          <div class="md:col-span-2">
            <label class="form-label">Email</label>
            <input type="email" v-model="customerForm.email" class="form-input" />
          </div>
          <div>
            <label class="form-label">Teléfono</label>
            <input type="tel" v-model="customerForm.phone" class="form-input" />
          </div>
           <div>
            <label class="form-label">Categoría</label>
            <select v-model="customerForm.category" class="form-input">
                <option v-for="cat in customerCategories" :key="cat" :value="cat">{{ cat }}</option>
            </select>
          </div>
        </div>
      </form>
      <template #actions>
        <button @click="closeDialog" class="button-secondary">Cancelar</button>
        <button @click="saveCustomer" class="button-primary">Guardar</button>
      </template>
    </BaseDialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useCustomerStore } from '../../stores/customers'
import BaseDialog from '../../components/ui/BaseDialog.vue'

const customerStore = useCustomerStore()

const loading = ref(false)
const search = ref('')
const dialog = ref(false)
const editingCustomer = ref(null)
const categoryFilter = ref(null)
const statusFilter = ref(null)

const customerForm = ref({
    firstName: '', lastName: '', email: '', phone: '', address: '', city: '', country: '',
    documentType: 'CEDULA', documentNumber: '', companyName: '', category: 'Normal',
    creditLimit: 0, status: 'activo'
})

const customerCategories = ['Normal', 'Mayorista', 'Preferencial']

const customers = computed(() => customerStore.customers)

const summary = computed(() => {
    return {
        totalCustomers: customers.value.length,
        activeCustomers: customers.value.filter(c => c.status === 'activo').length,
        premiumCustomers: customers.value.filter(c => c.category === 'Mayorista' || c.category === 'Preferencial').length,
        pendingBalance: customers.value.reduce((sum, c) => sum + (c.balance || 0), 0)
    }
})

const filteredCustomers = computed(() => {
    let filtered = customers.value;
    if (search.value) {
        const s = search.value.toLowerCase();
        filtered = filtered.filter(c =>
            `${c.firstName} ${c.lastName}`.toLowerCase().includes(s) ||
            c.email?.toLowerCase().includes(s) ||
            c.documentNumber?.includes(s)
        );
    }
    if (categoryFilter.value) {
        filtered = filtered.filter(c => c.category === categoryFilter.value);
    }
    if (statusFilter.value) {
        filtered = filtered.filter(c => c.status === statusFilter.value);
    }
    return filtered;
})

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

const openDialog = () => {
    editingCustomer.value = null
    customerForm.value = { /* reset form */ }
    dialog.value = true
}

const editCustomer = (customer) => {
    editingCustomer.value = customer
    customerForm.value = { ...customer }
    dialog.value = true
}

const closeDialog = () => {
    dialog.value = false
}

const saveCustomer = async () => {
    try {
        if (editingCustomer.value) {
            await customerStore.updateCustomer(editingCustomer.value.id, customerForm.value)
        } else {
            await customerStore.createCustomer(customerForm.value)
        }
        loadCustomers()
        closeDialog()
    } catch (error) {
        console.error('Error saving customer:', error)
    }
}

const deleteCustomerConfirmation = async (customer) => {
    if (confirm(`¿Está seguro de que desea eliminar a ${customer.firstName} ${customer.lastName}?`)) {
        try {
            await customerStore.deleteCustomer(customer.id)
            loadCustomers()
        } catch (error) {
            console.error('Error deleting customer:', error)
        }
    }
}

const formatCurrency = (amount) => {
    if (typeof amount !== 'number') return '$0.00';
    return amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

const getCategoryClass = (category) => {
    const classes = {
        'Normal': 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
        'Mayorista': 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300',
        'Preferencial': 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300',
    };
    return classes[category] || 'bg-gray-100 dark:bg-gray-700';
};

const getStatusClass = (status) => {
  return status === 'activo' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300';
};

const getStatusText = (status) => {
  return status === 'activo' ? 'Activo' : 'Inactivo';
};


onMounted(loadCustomers)
</script>

<style scoped>
.form-input, select.form-input {
  @apply w-full px-3 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm;
}
.form-label {
    @apply block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1;
}
.button-primary {
    @apply px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400;
}
.button-secondary {
    @apply px-4 py-2 rounded-lg bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600;
}
</style>
