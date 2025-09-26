<template>
  <div>
    <h1 class="text-h4 mb-4">Nueva Venta (POS)</h1>

    <v-row>
      <!-- Columna principal de la venta -->
      <v-col cols="12" md="8">
        <v-card>
          <v-card-text>
            <!-- Escáner de código de barras -->
            <barcode-scanner @scanned="addProductByBarcode" class="mb-4" />

            <!-- Lista de productos en el carrito -->
            <v-data-table
              :headers="cartHeaders"
              :items="cartItems"
              item-key="id"
              no-data-text="Agregue productos a la venta"
            >
              <template v-slot:item.name="{ item }">
                <div>
                  <div class="font-weight-medium">{{ item.name }}</div>
                  <div class="text-caption">{{ item.internalCode }}</div>
                </div>
              </template>

              <template v-slot:item.quantity="{ item }">
                <v-text-field
                  v-model.number="item.quantity"
                  type="number" 
                  min="1"
                  :max="item.stock"
                  style="width: 100px"
                  density="compact"
                  variant="outlined"
                  hide-details
                  @change="updateQuantity(item)"
                />
              </template>

              <template v-slot:item.price="{ item }">
                {{ formatCurrency(item.price) }}
              </template>

              <template v-slot:item.subtotal="{ item }">
                <span class="font-weight-bold">
                  {{ formatCurrency(item.subtotal) }}
                </span>
              </template>

              <template v-slot:item.actions="{ item }">
                <v-btn icon="mdi-delete" variant="text" color="error" size="small" @click="removeItem(item)" />
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Columna de resumen y pago -->
      <v-col cols="12" md="4">
        <v-card>
          <v-card-title>Resumen de la Venta</v-card-title>
          <v-card-text>
            <!-- Selección de cliente -->
            <v-autocomplete
              v-if="appStore.operationMode === 'tienda'"
              v-model="selectedCustomerId"
              :items="customers"
              item-title="name"
              item-value="id"
              label="Cliente"
              variant="outlined"
              density="compact"
              class="mb-4"
            >
              <template v-slot:item="{ props, item }">
                <v-list-item v-bind="props" :subtitle="item.raw.idNumber" />
              </template>
            </v-autocomplete>

            <v-divider class="my-4" />

            <!-- Totales -->
            <div class="d-flex justify-space-between mb-2">
              <span>Subtotal:</span>
              <span>{{ formatCurrency(totals.subtotal) }}</span>
            </div>
            <div class="d-flex justify-space-between mb-2">
              <span>IVA (16%):</span>
              <span>{{ formatCurrency(totals.tax) }}</span>
            </div>
            <div class="d-flex justify-space-between text-h6 font-weight-bold">
              <span>Total:</span>
              <span>{{ formatCurrency(totals.total) }}</span>
            </div>
          </v-card-text>

          <v-card-actions>
            <v-btn
              color="primary"
              block
              large
              :disabled="cartItems.length === 0 || processingSale"
              :loading="processingSale"
              @click="processSale"
            >
              Procesar Venta
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useProductStore } from '../../stores/products'
import { useCustomerStore } from '../../stores/customers'
import { useSaleStore } from '../../stores/sales'
import { useAppStore } from '../../stores/app'
import BarcodeScanner from '../../components/sales/BarcodeScanner.vue'

// Stores
const productStore = useProductStore()
const customerStore = useCustomerStore()
const saleStore = useSaleStore()
const appStore = useAppStore()

// State
const cartItems = ref([])
const selectedCustomerId = ref(1) // Default to "Cliente General"
const processingSale = ref(false)

// Headers for the cart table
const cartHeaders = [
  { title: 'Producto', key: 'name' },
  { title: 'Cantidad', key: 'quantity', sortable: false },
  { title: 'Precio Unit.', key: 'price', align: 'end' },
  { title: 'Subtotal', key: 'subtotal', align: 'end' },
  { title: 'Acciones', key: 'actions', sortable: false, align: 'center' }
]

// Computed Properties
const products = computed(() => productStore.products)
const customers = computed(() => customerStore.customers)

const totals = computed(() => {
  const subtotal = cartItems.value.reduce((acc, item) => acc + (item.quantity * item.price), 0)
  const tax = subtotal * 0.16 // Assuming 16% tax
  const total = subtotal + tax
  return { subtotal, tax, total }
})

const updateItemSubtotal = (item) => {
  item.subtotal = item.quantity * item.price
}

// Methods
const addProductByBarcode = (barcode) => {
  const product = products.value.find(p => p.barcode === barcode)
  if (product) {
    // Check if product is already in cart
    const existingItem = cartItems.value.find(item => item.id === product.id)
    if (existingItem) {
      if (existingItem.quantity < existingItem.stock) {
        existingItem.quantity++
        updateItemSubtotal(existingItem)
      } else {
        // Handle stock limit reached
        console.warn(`Stock limit reached for ${product.name}`)
        // TODO: Show user notification (e.g., snackbar)
      }
    } else {
      if (product.retailPrice == null || product.currentStock <= 0) {
        console.warn(`${product.name} is out of stock or has no price.`)
        // TODO: Show user notification
        return
      }
        cartItems.value.unshift({
          id: product.id,
          name: product.name,
          internalCode: product.internalCode,
          price: product.retailPrice,
          quantity: 1,
          stock: product.currentStock,
          subtotal: product.retailPrice // Initial subtotal
        })
        // No es necesario llamar a updateItemSubtotal aquí porque ya se calcula al crear
    }
  } else {
    // Handle product not found
    console.warn(`Product with barcode ${barcode} not found.`)
  }
}

const updateQuantity = (item) => {
  // Si la cantidad no es un número válido o es menor o igual a 0, elimina el ítem.
  if (!item.quantity || item.quantity <= 0) {
    removeItem(item)
    return
  }
  if (item.quantity > item.stock) {
    item.quantity = item.stock
    // TODO: Mostrar notificación al usuario (ej. "Cantidad ajustada al stock máximo")
    // TODO: Show user notification that quantity was adjusted to max stock
  }
  updateItemSubtotal(item)
}

const removeItem = (itemToRemove) => {
  cartItems.value = cartItems.value.filter(item => item.id !== itemToRemove.id)
}

const processSale = async () => {
  if (cartItems.value.length === 0) return

  processingSale.value = true
  try {
    const saleData = {
      customerId: selectedCustomerId.value,
      items: cartItems.value.map(item => ({
        productId: item.id,
        quantity: item.quantity,
        unitPrice: item.price
      })),
      // Los totales (subtotal, tax, total) deben ser calculados y validados en el backend
      // para mayor seguridad. Solo enviamos los datos crudos.
    }

    await saleStore.createSale(saleData)

    // Reset for next sale
    resetSale()

    // Show success message
    console.log('Sale processed successfully!')

  } catch (error) {
    console.error('Error processing sale:', error)
    // Show error message
  } finally {
    processingSale.value = false
  }
}

const resetSale = () => {
  cartItems.value = []
  selectedCustomerId.value = 1
}

const formatCurrency = (amount) => {
  const value = typeof amount === 'number' ? amount : 0;
  return new Intl.NumberFormat('es-VE', {
    style: 'currency',
    currency: 'VES'
  }).format(value)
}

// Lifecycle Hooks
onMounted(async () => {
  // Fetch necessary data when the component is mounted
  await Promise.all([
    productStore.fetchProducts(),
    customerStore.fetchCustomers()
  ])
})
</script>

<style scoped>
/* Add any specific styles for the POS view here */
</style>
