<template>
  <div>
    <v-row class="mb-4">
      <v-col cols="12" md="6">
        <h1 class="text-h4">Nueva Venta</h1>
        <v-chip
          :color="currentMode === 'bodega' ? 'orange' : 'green'"
          size="small"
          class="mt-2"
        >
          <v-icon left>{{ currentMode === 'bodega' ? 'mdi-warehouse' : 'mdi-store' }}</v-icon>
          Modo {{ currentMode === 'bodega' ? 'Bodega' : 'Tienda' }}
        </v-chip>
      </v-col>
      <v-col cols="12" md="6" class="text-right">
        <v-btn
          color="error"
          variant="outlined"
          @click="clearSale"
          prepend-icon="mdi-delete"
          class="mr-2"
        >
          Limpiar
        </v-btn>
        <v-btn
          color="success"
          @click="openPaymentDialog"
          :disabled="cartItems.length === 0"
          prepend-icon="mdi-cash"
        >
          Procesar Pago
        </v-btn>
      </v-col>
    </v-row>

    <v-row>
      <!-- Panel izquierdo: Búsqueda y productos -->
      <v-col cols="12" lg="8">
        <!-- Búsqueda de productos -->
        <v-card class="mb-4">
          <v-card-title>Buscar Productos</v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="12" md="8">
                <v-text-field
                  v-model="productSearch"
                  label="Código, nombre o código de barras"
                  prepend-inner-icon="mdi-magnify"
                  variant="outlined"
                  density="compact"
                  @keyup.enter="searchProducts"
                  @input="onSearchInput"
                  clearable
                />
              </v-col>
              <v-col cols="12" md="4">
                <v-btn
                  color="primary"
                  block
                  @click="openBarcodeScanner"
                  prepend-icon="mdi-barcode-scan"
                >
                  Escanear
                </v-btn>
              </v-col>
            </v-row>

            <!-- Resultados de búsqueda -->
            <div v-if="searchResults.length > 0" class="mt-4">
              <v-divider class="mb-3" />
              <v-row>
                <v-col
                  v-for="product in searchResults"
                  :key="product.id"
                  cols="12" md="6" lg="4"
                >
                  <v-card
                    variant="outlined"
                    class="product-card"
                    @click="addToCart(product)"
                  >
                    <v-card-text class="py-2">
                      <div class="d-flex align-center">
                        <v-avatar size="40" class="mr-3">
                          <v-img
                            v-if="product.image"
                            :src="product.image"
                            alt="Producto"
                          />
                          <v-icon v-else>mdi-package-variant</v-icon>
                        </v-avatar>
                        <div class="flex-grow-1">
                          <div class="font-weight-medium text-truncate">
                            {{ product.name }}
                          </div>
                          <div class="text-caption text-medium-emphasis">
                            {{ product.internalCode }}
                          </div>
                          <div class="text-h6 text-primary">
                            {{ formatCurrency(getProductPrice(product)) }}
                          </div>
                        </div>
                        <div class="text-right">
                          <v-chip
                            :color="getStockColor(product)"
                            size="small"
                            variant="tonal"
                          >
                            {{ product.currentStock }}
                          </v-chip>
                        </div>
                      </div>
                    </v-card-text>
                  </v-card>
                </v-col>
              </v-row>
            </div>
          </v-card-text>
        </v-card>

        <!-- Calculadora integrada -->
        <v-card>
          <v-card-title>Calculadora</v-card-title>
          <v-card-text>
            <Calculator @result="onCalculatorResult" />
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Panel derecho: Carrito y resumen -->
      <v-col cols="12" lg="4">
        <!-- Información del cliente (solo en modo tienda) -->
        <v-card v-if="currentMode === 'tienda'" class="mb-4">
          <v-card-title>Cliente</v-card-title>
          <v-card-text>
            <v-autocomplete
              v-model="selectedCustomer"
              :items="customers"
              item-title="displayName"
              item-value="id"
              label="Seleccionar cliente"
              variant="outlined"
              density="compact"
              clearable
              @update:model-value="onCustomerSelected"
            >
              <template v-slot:item="{ props, item }">
                <v-list-item v-bind="props">
                  <v-list-item-title>{{ item.raw.displayName }}</v-list-item-title>
                  <v-list-item-subtitle>{{ item.raw.documentNumber }}</v-list-item-subtitle>
                </v-list-item>
              </template>
            </v-autocomplete>

            <div v-if="customerInfo" class="mt-2">
              <v-chip size="small" :color="customerInfo.category === 'mayorista' ? 'primary' : 'default'">
                {{ customerInfo.category }}
              </v-chip>
              <div class="text-caption mt-1">
                Descuento: {{ customerInfo.discount }}%
              </div>
            </div>
          </v-card-text>
        </v-card>

        <!-- Carrito de compras -->
        <v-card class="mb-4">
          <v-card-title class="d-flex justify-space-between align-center">
            <span>Carrito ({{ cartItems.length }})</span>
            <v-select
              v-model="saleType"
              :items="saleTypeOptions"
              variant="outlined"
              density="compact"
              hide-details
              style="max-width: 120px"
            />
          </v-card-title>
          <v-card-text class="pa-0">
            <div v-if="cartItems.length === 0" class="text-center py-8 text-medium-emphasis">
              <v-icon size="48" class="mb-2">mdi-cart-outline</v-icon>
              <div>Carrito vacío</div>
              <div class="text-caption">Busca y agrega productos</div>
            </div>

            <v-list v-else density="compact">
              <v-list-item
                v-for="(item, index) in cartItems"
                :key="index"
                class="px-3"
              >
                <template v-slot:prepend>
                  <v-avatar size="32">
                    <v-img
                      v-if="item.product.image"
                      :src="item.product.image"
                      alt="Producto"
                    />
                    <v-icon v-else size="16">mdi-package-variant</v-icon>
                  </v-avatar>
                </template>

                <v-list-item-title class="text-wrap">
                  {{ item.product.name }}
                </v-list-item-title>
                <v-list-item-subtitle>
                  {{ formatCurrency(item.unitPrice) }} x {{ item.quantity }}
                </v-list-item-subtitle>

                <template v-slot:append>
                  <div class="d-flex align-center">
                    <v-btn
                      icon="mdi-minus"
                      size="x-small"
                      variant="text"
                      @click="updateQuantity(index, item.quantity - 1)"
                    />
                    <span class="mx-2 font-weight-medium">{{ item.quantity }}</span>
                    <v-btn
                      icon="mdi-plus"
                      size="x-small"
                      variant="text"
                      @click="updateQuantity(index, item.quantity + 1)"
                    />
                    <v-btn
                      icon="mdi-delete"
                      size="x-small"
                      variant="text"
                      color="error"
                      class="ml-2"
                      @click="removeFromCart(index)"
                    />
                  </div>
                </template>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>

        <!-- Resumen de la venta -->
        <v-card>
          <v-card-title>Resumen</v-card-title>
          <v-card-text>
            <div class="d-flex justify-space-between mb-2">
              <span>Subtotal:</span>
              <span>{{ formatCurrency(subtotal) }}</span>
            </div>

            <div v-if="discountAmount > 0" class="d-flex justify-space-between mb-2">
              <span>Descuento:</span>
              <span class="text-success">-{{ formatCurrency(discountAmount) }}</span>
            </div>

            <div v-if="taxAmount > 0" class="d-flex justify-space-between mb-2">
              <span>IVA ({{ defaultTaxRate }}%):</span>
              <span>{{ formatCurrency(taxAmount) }}</span>
            </div>

            <v-divider class="my-2" />

            <div class="d-flex justify-space-between text-h6 font-weight-bold">
              <span>Total:</span>
              <span>{{ formatCurrency(total) }}</span>
            </div>

            <!-- Controles de descuento -->
            <v-row class="mt-3">
              <v-col cols="6">
                <v-text-field
                  v-model.number="discountPercentage"
                  label="Desc. %"
                  variant="outlined"
                  density="compact"
                  type="number"
                  suffix="%"
                  @input="calculateTotals"
                />
              </v-col>
              <v-col cols="6">
                <v-text-field
                  v-model.number="manualDiscountAmount"
                  label="Desc. Bs"
                  variant="outlined"
                  density="compact"
                  type="number"
                  @input="onManualDiscountChange"
                />
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Dialog de pago -->
    <PaymentDialog
      v-model="paymentDialog"
      :sale-data="saleData"
      @payment-completed="onPaymentCompleted"
    />

    <!-- Dialog de escáner de código de barras -->
    <BarcodeScanner
      v-model="scannerDialog"
      @barcode-scanned="onBarcodeScanned"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import PaymentDialog from '../../components/sales/PaymentDialog.vue'
import BarcodeScanner from '../../components/sales/BarcodeScanner.vue'
import Calculator from '../../components/sales/Calculator.vue'
import { useProductStore } from '../../stores/products'
import { useCustomerStore } from '../../stores/customers'
import { useSalesStore } from '../../stores/sales'
import { useAppStore } from '../../stores/app'

const productStore = useProductStore()
const customerStore = useCustomerStore()
const salesStore = useSalesStore()
const appStore = useAppStore()

// Estado reactivo
const productSearch = ref('')
const searchResults = ref([])
const cartItems = ref([])
const selectedCustomer = ref(null)
const customerInfo = ref(null)
const saleType = ref('detal')
const discountPercentage = ref(0)
const manualDiscountAmount = ref(0)
const paymentDialog = ref(false)
const scannerDialog = ref(false)

// Opciones
const saleTypeOptions = [
  { title: 'Detal', value: 'detal' },
  { title: 'Mayorista', value: 'mayorista' },
  { title: 'Mixta', value: 'mixta' }
]

// Computed properties
const currentMode = computed(() => appStore.mode)
const customers = computed(() => customerStore.customers.map(c => ({
  ...c,
  displayName: c.companyName || `${c.firstName} ${c.lastName}`
})))
const defaultTaxRate = computed(() => appStore.settings.defaultTaxRate || 16)

const subtotal = computed(() => {
  return cartItems.value.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0)
})

const discountAmount = computed(() => {
  if (manualDiscountAmount.value > 0) {
    return manualDiscountAmount.value
  }
  return subtotal.value * (discountPercentage.value / 100)
})

const taxAmount = computed(() => {
  const taxableAmount = subtotal.value - discountAmount.value
  return taxableAmount * (defaultTaxRate.value / 100)
})

const total = computed(() => {
  return subtotal.value - discountAmount.value + taxAmount.value
})

const saleData = computed(() => ({
  items: cartItems.value,
  customerId: selectedCustomer.value,
  saleType: saleType.value,
  operationMode: currentMode.value,
  subtotal: subtotal.value,
  discountAmount: discountAmount.value,
  discountPercentage: discountPercentage.value,
  taxAmount: taxAmount.value,
  total: total.value
}))

// Métodos
const searchProducts = async () => {
  if (!productSearch.value.trim()) {
    searchResults.value = []
    return
  }

  try {
    const results = await productStore.searchProducts(productSearch.value)
    searchResults.value = results.slice(0, 12) // Limitar resultados
  } catch (error) {
    console.error('Error buscando productos:', error)
  }
}

const onSearchInput = () => {
  if (productSearch.value.length >= 2) {
    searchProducts()
  } else {
    searchResults.value = []
  }
}

const addToCart = (product) => {
  if (product.currentStock <= 0) {
    // Mostrar alerta de stock insuficiente
    return
  }

  const existingIndex = cartItems.value.findIndex(item => item.product.id === product.id)
  
  if (existingIndex >= 0) {
    updateQuantity(existingIndex, cartItems.value[existingIndex].quantity + 1)
  } else {
    cartItems.value.push({
      product,
      quantity: 1,
      unitPrice: getProductPrice(product),
      discountPercentage: 0,
      discountAmount: 0
    })
  }

  // Limpiar búsqueda
  productSearch.value = ''
  searchResults.value = []
}

const updateQuantity = (index, newQuantity) => {
  if (newQuantity <= 0) {
    removeFromCart(index)
    return
  }

  const item = cartItems.value[index]
  if (newQuantity > item.product.currentStock) {
    // Mostrar alerta de stock insuficiente
    return
  }

  cartItems.value[index].quantity = newQuantity
  calculateTotals()
}

const removeFromCart = (index) => {
  cartItems.value.splice(index, 1)
  calculateTotals()
}

const getProductPrice = (product) => {
  switch (saleType.value) {
    case 'mayorista':
      return product.wholesalePrice || product.retailPrice
    case 'detal':
    default:
      return product.retailPrice
  }
}

const getStockColor = (product) => {
  if (product.currentStock === 0) return 'error'
  if (product.currentStock <= product.minStock) return 'warning'
  return 'success'
}

const onCustomerSelected = async (customerId) => {
  if (customerId) {
    customerInfo.value = await customerStore.getCustomerById(customerId)
    if (customerInfo.value?.discount > 0) {
      discountPercentage.value = customerInfo.value.discount
      calculateTotals()
    }
  } else {
    customerInfo.value = null
    discountPercentage.value = 0
    calculateTotals()
  }
}

const calculateTotals = () => {
  // Recalcular precios según tipo de venta
  cartItems.value.forEach(item => {
    item.unitPrice = getProductPrice(item.product)
  })
}

const onManualDiscountChange = () => {
  if (manualDiscountAmount.value > 0) {
    discountPercentage.value = 0
  }
}

const clearSale = () => {
  cartItems.value = []
  selectedCustomer.value = null
  customerInfo.value = null
  discountPercentage.value = 0
  manualDiscountAmount.value = 0
  productSearch.value = ''
  searchResults.value = []
}

const openPaymentDialog = () => {
  paymentDialog.value = true
}

const openBarcodeScanner = () => {
  scannerDialog.value = true
}

const onBarcodeScanned = async (barcode) => {
  scannerDialog.value = false
  const product = await productStore.getProductByBarcode(barcode)
  if (product) {
    addToCart(product)
  }
}

const onCalculatorResult = (result) => {
  // Usar resultado de calculadora como descuento o cantidad
  if (cartItems.value.length > 0) {
    manualDiscountAmount.value = result
    discountPercentage.value = 0
  }
}

const onPaymentCompleted = (saleResult) => {
  paymentDialog.value = false
  clearSale()
  
  // Mostrar confirmación y opción de imprimir
  console.log('Venta completada:', saleResult)
}

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('es-VE', {
    style: 'currency',
    currency: 'VES'
  }).format(amount)
}

// Watchers
watch(saleType, () => {
  calculateTotals()
})

// Lifecycle
onMounted(async () => {
  await productStore.fetchProducts()
  if (appStore.mode === 'tienda') {
    await customerStore.fetchCustomers()
  }
})
</script>

<style scoped>
.product-card {
  cursor: pointer;
  transition: all 0.2s;
}

.product-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}
</style>
