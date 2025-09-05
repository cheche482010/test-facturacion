<template>
  <v-container fluid>
    <v-row>
      <!-- Columna Principal de Venta -->
      <v-col cols="12" md="7">
        <v-card>
          <v-card-title>
            <span class="text-h5">Punto de Venta</span>
          </v-card-title>
          <v-divider></v-divider>
          <v-card-text>
            <!-- Búsqueda de Productos -->
            <v-autocomplete
              v-model="selectedProduct"
              :items="searchedProducts"
              :loading="isSearching"
              :search-input.sync="searchTerm"
              item-title="name"
              item-value="id"
              label="Buscar producto por nombre o código"
              placeholder="Escribe para buscar..."
              prepend-inner-icon="mdi-magnify"
              return-object
              clearable
              hide-no-data
              @update:search="searchProducts"
              @update:modelValue="addProductToCart"
            >
              <template v-slot:item="{ props, item }">
                <v-list-item v-bind="props" :title="item.raw.name">
                  <template v-slot:subtitle>
                    <div class="d-flex justify-space-between">
                      <span>Código: {{ item.raw.code }}</span>
                      <span class="font-weight-bold">{{ formatCurrency(item.raw.price) }}</span>
                    </div>
                  </template>
                </v-list-item>
              </template>
            </v-autocomplete>

            <!-- Lista de Productos en el Carrito -->
            <v-list lines="two" class="mt-4">
              <v-list-subheader>Productos en la venta</v-list-subheader>
              <div v-if="cart.length === 0" class="text-center text-grey pa-4">
                Aún no hay productos en la venta.
              </div>
              <template v-for="(item, index) in cart" :key="item.id">
                <v-list-item>
                  <v-list-item-title>{{ item.name }}</v-list-item-title>
                  <v-list-item-subtitle>{{ formatCurrency(item.price) }}</v-list-item-subtitle>
                  <template v-slot:append>
                    <div class="d-flex align-center">
                      <v-btn size="x-small" icon="mdi-minus" @click="updateQuantity(item, -1)" variant="tonal"></v-btn>
                      <span class="mx-4 font-weight-bold">{{ item.quantity }}</span>
                      <v-btn size="x-small" icon="mdi-plus" @click="updateQuantity(item, 1)" variant="tonal"></v-btn>
                      <span class="mx-4 font-weight-bold" style="width: 100px; text-align: right;">{{ formatCurrency(item.price * item.quantity) }}</span>
                      <v-btn size="x-small" icon="mdi-delete" @click="removeFromCart(item)" color="red-darken-1" variant="text"></v-btn>
                    </div>
                  </template>
                </v-list-item>
                <v-divider v-if="index < cart.length - 1"></v-divider>
              </template>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Columna de Resumen y Pago -->
      <v-col cols="12" md="5">
        <v-card>
          <v-card-title>
            <span class="text-h5">Resumen de la Venta</span>
          </v-card-title>
          <v-divider></v-divider>
          <v-card-text>
            <v-list density="compact">
              <v-list-item>
                <v-list-item-title>Subtotal</v-list-item-title>
                <template v-slot:append>
                  <span class="font-weight-bold">{{ formatCurrency(summary.subtotal) }}</span>
                </template>
              </v-list-item>
              <v-list-item>
                <v-list-item-title>IVA (16%)</v-list-item-title>
                <template v-slot:append>
                  <span class="font-weight-bold">{{ formatCurrency(summary.tax) }}</span>
                </template>
              </v-list-item>
              <v-list-item class="font-weight-bold text-h6">
                <v-list-item-title>Total</v-list-item-title>
                <template v-slot:append>
                  <span>{{ formatCurrency(summary.total) }}</span>
                </template>
              </v-list-item>
            </v-list>

            <v-divider class="my-4"></v-divider>

            <h3 class="text-h6 mb-2">Método de Pago</h3>
            <v-chip-group v-model="paymentMethod" mandatory filter>
              <v-chip value="efectivo" label>Efectivo</v-chip>
              <v-chip value="pos" label>Punto de Venta</v-chip>
              <v-chip value="transferencia" label>Transferencia</v-chip>
              <v-chip value="pago_movil" label>Pago Móvil</v-chip>
            </v-chip-group>

          </v-card-text>
          <v-divider></v-divider>
          <v-card-actions class="pa-4">
            <v-btn block size="large" color="error" @click="resetSale" variant="text">
              Cancelar
            </v-btn>
            <v-btn block size="large" color="success" @click="completeSale" :disabled="cart.length === 0" :loading="isCompletingSale">
              Completar Venta
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <!-- Snackbar para notificaciones -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="4000" location="top right">
      {{ snackbar.message }}
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, computed } from 'vue'
import axios from 'axios'
import { debounce } from 'lodash'
import saleService from '@/services/saleService'

// --- State ---
const searchTerm = ref('')
const selectedProduct = ref(null)
const searchedProducts = ref([])
const isSearching = ref(false)
const isCompletingSale = ref(false)
const cart = ref([])
const paymentMethod = ref('efectivo')
const snackbar = ref({ show: false, message: '', color: '' })

// --- Computed Properties ---
const summary = computed(() => {
  const subtotal = cart.value.reduce((acc, item) => acc + item.price * item.quantity, 0)
  const tax = subtotal * 0.16 // Asumir 16% de IVA
  const total = subtotal + tax
  return { subtotal, tax, total }
})

// --- Methods ---
const searchProducts = debounce(async (query) => {
  if (!query || query.length < 2) {
    searchedProducts.value = []
    return
  }
  isSearching.value = true
  try {
    const { data } = await axios.get(`/api/products/search?term=${query}`)
    searchedProducts.value = data
  } catch (error) {
    console.error('Error buscando productos:', error)
    showSnackbar('Error al buscar productos', 'error')
  } finally {
    isSearching.value = false
  }
}, 300)

function addProductToCart(product) {
  if (!product) return

  const existingItem = cart.value.find(item => item.id === product.id)
  if (existingItem) {
    if (existingItem.quantity < existingItem.stock) {
      existingItem.quantity++
    } else {
      showSnackbar('No hay más stock disponible para este producto', 'warning')
    }
  } else {
    if (product.stock > 0) {
      cart.value.push({ ...product, quantity: 1 })
    } else {
      showSnackbar('Este producto no tiene stock', 'warning')
    }
  }

  selectedProduct.value = null
  searchedProducts.value = []
}

function updateQuantity(item, change) {
  const newQuantity = item.quantity + change
  if (newQuantity <= 0) {
    removeFromCart(item)
  } else if (newQuantity > item.stock) {
    showSnackbar('No hay más stock disponible', 'warning')
  } else {
    item.quantity = newQuantity
  }
}

function removeFromCart(itemToRemove) {
  cart.value = cart.value.filter(item => item.id !== itemToRemove.id)
}

async function completeSale() {
  if (cart.value.length === 0) {
    showSnackbar('No hay productos en la venta', 'error')
    return
  }

  isCompletingSale.value = true

  const saleData = {
    items: cart.value.map(item => ({
      productId: item.id,
      quantity: item.quantity,
      unitPrice: item.price,
      subtotal: item.price * item.quantity
    })),
    summary: summary.value,
    paymentMethod: paymentMethod.value,
  }

  try {
    await saleService.createSale(saleData)
    showSnackbar('Venta creada con éxito', 'success')
    resetSale()
  } catch (error) {
    const errorMessage = error.response?.data?.message || 'Error al crear la venta'
    showSnackbar(errorMessage, 'error')
    console.error(error)
  } finally {
    isCompletingSale.value = false
  }
}

function resetSale() {
  cart.value = []
  paymentMethod.value = 'efectivo'
  searchTerm.value = ''
  searchedProducts.value = []
  selectedProduct.value = null
}

function showSnackbar(message, color) {
  snackbar.value.message = message
  snackbar.value.color = color
  snackbar.value.show = true
}

function formatCurrency(value) {
    if (typeof value !== 'number') {
        return value;
    }
    return new Intl.NumberFormat('es-VE', { style: 'currency', currency: 'VES' }).format(value);
}
</script>

<style scoped>
.v-list-item-subtitle {
  display: flex;
  justify-content: space-between;
  width: 100%;
}
</style>
