<template>
  <div class="text-black dark:text-white">
    <!-- Header -->
    <div class="flex justify-between items-center mb-6">
      <div class="flex items-center">
        <router-link to="/" class="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700 mr-4">
          <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
        </router-link>
        <div>
            <h1 class="text-3xl font-bold">Punto de Venta</h1>
            <p class="text-gray-500 dark:text-gray-400">Cree una nueva factura para un cliente.</p>
        </div>
      </div>
      <button @click="clearSale" class="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center">
        <svg class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
        <span>Cancelar Venta</span>
      </button>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Left Column -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Customer Info -->
        <div class="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
          <h2 class="text-xl font-semibold mb-4">Información del Cliente</h2>
          <div class="flex space-x-4">
            <div class="flex-grow">
              <CustomAutocomplete
                v-model="selectedCustomer"
                :items="customers"
                item-title="displayName"
                item-value="id"
                placeholder="Busque o seleccione un cliente"
                @update:modelValue="onCustomerSelected"
              />
            </div>
            <button class="bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 px-4 py-2 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900 flex items-center">
              <svg class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
              <span>Nuevo Cliente</span>
            </button>
          </div>
           <div v-if="!selectedCustomer" class="text-center py-6 border-2 border-dashed rounded-lg mt-4">
            <p class="text-gray-500">Ningún cliente seleccionado</p>
          </div>
          <!-- Customer details would go here -->
        </div>

        <!-- Product Search -->
        <div class="relative">
          <svg class="h-5 w-5 text-gray-400 absolute top-3 left-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input
            type="text"
            v-model="productSearch"
            @input="onSearchInput"
            placeholder="Buscar producto por nombre, código o escanear..."
            class="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <!-- Search results dropdown could be implemented here -->
        </div>

        <!-- Shopping Cart -->
        <div class="bg-white dark:bg-slate-800 rounded-lg shadow-md">
          <h2 class="text-xl font-semibold p-6 border-b dark:border-slate-700">Carrito de Compras</h2>
          <div v-if="cartItems.length === 0" class="text-center py-16 text-gray-500">
            <svg class="h-12 w-12 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
            <p>El carrito está vacío</p>
          </div>
          <div v-else class="divide-y dark:divide-slate-700">
             <div v-for="(item, index) in cartItems" :key="index" class="p-4 flex items-center space-x-4">
                <div class="flex-1">
                    <p class="font-semibold">{{ item.product.name }}</p>
                    <p class="text-sm text-gray-500">{{ formatCurrency(item.unitPrice) }}</p>
                </div>
                <div class="flex items-center">
                    <button @click="updateQuantity(index, item.quantity - 1)" class="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700">-</button>
                    <span class="px-4">{{ item.quantity }}</span>
                    <button @click="updateQuantity(index, item.quantity + 1)" class="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700">+</button>
                </div>
                <p class="w-24 text-right font-semibold">{{ formatCurrency(item.unitPrice * item.quantity) }}</p>
                <button @click="removeFromCart(index)" class="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700">
                    <svg class="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Column -->
      <div class="lg:col-span-1">
        <div class="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md sticky top-8">
          <h2 class="text-xl font-semibold mb-4">Resumen de la Venta</h2>
          <div class="space-y-3">
            <div class="flex justify-between"><span>Subtotal</span><span>{{ formatCurrency(subtotal) }}</span></div>
            <div class="flex justify-between"><span>Descuento</span><span class="text-green-500">-{{ formatCurrency(discountAmount) }}</span></div>
            <div class="flex justify-between"><span>IVA ({{ defaultTaxRate }}%)</span><span>{{ formatCurrency(taxAmount) }}</span></div>
            <div class="border-t dark:border-slate-700 my-3"></div>
            <div class="flex justify-between font-bold text-lg"><span>Total</span><span>{{ formatCurrency(total) }}</span></div>
          </div>

          <div class="mt-6">
            <label for="global-discount" class="block text-sm font-medium mb-1">Descuento Global ($)</label>
            <input type="number" v-model.number="manualDiscountAmount" id="global-discount" class="form-input" placeholder="0" />
          </div>

          <div class="mt-4">
            <label for="payment-method" class="block text-sm font-medium mb-1">Método de Pago</label>
            <select id="payment-method" v-model="paymentMethod" class="form-input">
              <option>Efectivo (Bs)</option>
              <option>Tarjeta</option>
              <option>Transferencia</option>
            </select>
          </div>

          <div class="mt-4">
            <label for="notes" class="block text-sm font-medium mb-1">Notas</label>
            <textarea id="notes" v-model="notes" rows="3" class="form-input" placeholder="Añadir notas a la factura..."></textarea>
          </div>

          <div class="mt-6">
            <button @click="openPaymentDialog" :disabled="cartItems.length === 0" class="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed">
              Procesar Venta
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Dialogs -->
    <PaymentDialog
      v-model="paymentDialog"
      :sale-data="saleData"
      @payment-completed="onPaymentCompleted"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import PaymentDialog from '../../components/sales/PaymentDialog.vue'
import CustomAutocomplete from '../../components/ui/CustomAutocomplete.vue'
import { useProductStore } from '../../stores/products'
import { useCustomerStore } from '../../stores/customers'
import { useAppStore } from '../../stores/app'

const productStore = useProductStore()
const customerStore = useCustomerStore()
const appStore = useAppStore()

// State
const productSearch = ref('')
const searchResults = ref([])
const cartItems = ref([])
const selectedCustomer = ref(null)
const customerInfo = ref(null)
const manualDiscountAmount = ref(0)
const paymentDialog = ref(false)
const paymentMethod = ref('Efectivo (Bs)')
const notes = ref('')

// Computed
const customers = computed(() => customerStore.customers.map(c => ({
  ...c,
  displayName: c.companyName || `${c.firstName} ${c.lastName}`
})))
const defaultTaxRate = computed(() => appStore.settings.defaultTaxRate || 16)

const subtotal = computed(() => cartItems.value.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0))
const discountAmount = computed(() => manualDiscountAmount.value || 0)
const taxAmount = computed(() => (subtotal.value - discountAmount.value) * (defaultTaxRate.value / 100))
const total = computed(() => subtotal.value - discountAmount.value + taxAmount.value)

const saleData = computed(() => ({
  items: cartItems.value,
  customerId: selectedCustomer.value,
  subtotal: subtotal.value,
  discountAmount: discountAmount.value,
  taxAmount: taxAmount.value,
  total: total.value,
  paymentMethod: paymentMethod.value,
  notes: notes.value
}))

// Methods
const onSearchInput = async () => {
  if (productSearch.value.length < 2) {
    searchResults.value = [];
    return;
  }
  try {
    const results = await productStore.searchProducts(productSearch.value);
    if (results.length === 1) {
        addToCart(results[0]);
        productSearch.value = '';
    } else {
        searchResults.value = results;
    }
  } catch (error) {
    console.error('Error searching products:', error);
  }
}

const addToCart = (product) => {
  if (product.currentStock <= 0) return;
  const existingIndex = cartItems.value.findIndex(item => item.product.id === product.id);
  if (existingIndex >= 0) {
    updateQuantity(existingIndex, cartItems.value[existingIndex].quantity + 1);
  } else {
    cartItems.value.push({
      product,
      quantity: 1,
      unitPrice: product.retailPrice, // Simplified pricing
    });
  }
}

const updateQuantity = (index, newQuantity) => {
  if (newQuantity <= 0) {
    removeFromCart(index);
    return;
  }
  if (newQuantity > cartItems.value[index].product.currentStock) return;
  cartItems.value[index].quantity = newQuantity;
}

const removeFromCart = (index) => {
  cartItems.value.splice(index, 1);
}

const onCustomerSelected = async (customerId) => {
  if (customerId) {
    customerInfo.value = await customerStore.getCustomerById(customerId);
  } else {
    customerInfo.value = null;
  }
}

const clearSale = () => {
  cartItems.value = [];
  selectedCustomer.value = null;
  customerInfo.value = null;
  manualDiscountAmount.value = 0;
  productSearch.value = '';
  searchResults.value = [];
  notes.value = '';
}

const openPaymentDialog = () => {
  paymentDialog.value = true;
}

const onPaymentCompleted = (saleResult) => {
  paymentDialog.value = false;
  clearSale();
  console.log('Sale completed:', saleResult);
}

const formatCurrency = (amount) => {
  if (typeof amount !== 'number') return '$0.00';
  return amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

onMounted(async () => {
  await productStore.fetchProducts();
  await customerStore.fetchCustomers();
});

</script>

<style scoped>
.form-input {
  @apply w-full px-3 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm;
}
</style>
