<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title class="d-flex align-center">
            <span class="text-h5">Gestión de Productos</span>
            <v-spacer></v-spacer>
            <v-text-field
              v-model="search"
              density="compact"
              label="Buscar producto"
              prepend-inner-icon="mdi-magnify"
              variant="solo-filled"
              flat
              hide-details
              single-line
              class="mr-4"
              style="max-width: 300px;"
            ></v-text-field>
            <v-btn color="primary" prepend-icon="mdi-plus" @click="openNewProductDialog">
              Nuevo Producto
            </v-btn>
          </v-card-title>
          <v-divider></v-divider>

          <v-data-table
            :headers="headers"
            :items="products"
            :search="search"
            :loading="loading"
            loading-text="Cargando productos..."
            no-data-text="No se encontraron productos"
            items-per-page-text="Productos por página"
          >
            <template v-slot:item.price="{ item }">
              <span>{{ formatCurrency(item.price) }}</span>
            </template>
            <template v-slot:item.actions="{ item }">
              <v-icon class="mr-2" @click="editProduct(item)" color="grey-darken-1">mdi-pencil</v-icon>
              <v-icon @click="deleteProduct(item)" color="red-darken-1">mdi-delete</v-icon>
            </template>
          </v-data-table>
        </v-card>
      </v-col>
    </v-row>

    <!-- Dialogo para crear/editar producto -->
    <v-dialog v-model="dialog" max-width="700px" persistent>
      <v-card>
        <v-card-title>
          <span class="text-h5">{{ formTitle }}</span>
        </v-card-title>
        <v-card-text>
          <v-form ref="form" v-model="valid">
            <v-container>
              <v-row>
                <v-col cols="12" sm="6" md="4">
                  <v-text-field v-model="editedItem.code" label="Código Interno" :rules="[rules.required]" required density="compact" variant="outlined"></v-text-field>
                </v-col>
                <v-col cols="12" sm="6" md="8">
                  <v-text-field v-model="editedItem.name" label="Nombre del Producto" :rules="[rules.required]" required density="compact" variant="outlined"></v-text-field>
                </v-col>
                <v-col cols="12">
                  <v-textarea v-model="editedItem.description" label="Descripción" rows="2" density="compact" variant="outlined"></v-textarea>
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field v-model.number="editedItem.cost" label="Costo de Compra ($)" type="number" prefix="$" :rules="[rules.required, rules.positiveNumber]" required density="compact" variant="outlined"></v-text-field>
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field v-model.number="editedItem.profitPercentage" label="Porcentaje de Ganancia (%)" type="number" suffix="%" :rules="[rules.required, rules.positiveNumber]" required density="compact" variant="outlined"></v-text-field>
                </v-col>
                 <v-col cols="12" sm="6">
                  <v-text-field :model-value="formatCurrency(calculatedPrice)" label="Precio de Venta (calculado)" readonly filled density="compact" variant="outlined"></v-text-field>
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field v-model.number="editedItem.stock" label="Stock Inicial" type="number" :rules="[rules.required, rules.integer]" required density="compact" variant="outlined"></v-text-field>
                </v-col>
              </v-row>
            </v-container>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue-darken-1" variant="text" @click="closeDialog">Cancelar</v-btn>
          <v-btn color="primary" variant="tonal" @click="saveProduct" :disabled="!valid" :loading="saving">Guardar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialogo de confirmación de eliminación -->
    <v-dialog v-model="deleteDialog" max-width="500px">
      <v-card>
        <v-card-title class="text-h5 text-center">¿Estás seguro?</v-card-title>
        <v-card-text class="text-center">¿Realmente deseas eliminar este producto? Esta acción no se puede deshacer.</v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey-darken-1" variant="text" @click="closeDeleteDialog">Cancelar</v-btn>
          <v-btn color="red-darken-1" variant="tonal" @click="confirmDeleteProduct" :loading="deleting">Eliminar</v-btn>
          <v-spacer></v-spacer>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar para notificaciones -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="4000" location="top right">
      {{ snackbar.message }}
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, computed, nextTick, onMounted } from 'vue'
import productService from '@/services/productService'

// --- State ---
const search = ref('')
const loading = ref(false)
const saving = ref(false)
const deleting = ref(false)
const dialog = ref(false)
const deleteDialog = ref(false)
const valid = ref(true)
const snackbar = ref({
  show: false,
  message: '',
  color: ''
})

const headers = ref([
  { title: 'Código', key: 'code', align: 'start' },
  { title: 'Nombre', key: 'name' },
  { title: 'Precio Venta', key: 'price' },
  { title: 'Stock', key: 'stock' },
  { title: 'Acciones', key: 'actions', sortable: false, align: 'end' }
])
const products = ref([])
const editedIndex = ref(-1)
const editedItem = ref({
  id: null,
  code: '',
  name: '',
  description: '',
  cost: 0,
  profitPercentage: 30,
  price: 0,
  stock: 0,
})
const defaultItem = { ...editedItem.value }
const productToDelete = ref(null)
const form = ref(null)

// --- Computed Properties ---
const formTitle = computed(() => {
  return editedIndex.value === -1 ? 'Nuevo Producto' : 'Editar Producto'
})

const calculatedPrice = computed(() => {
  const cost = parseFloat(editedItem.value.cost)
  const percentage = parseFloat(editedItem.value.profitPercentage)
  if (!isNaN(cost) && !isNaN(percentage)) {
    return (cost * (1 + percentage / 100))
  }
  return 0
})

// --- Methods ---
async function fetchProducts() {
  loading.value = true
  try {
    const response = await productService.getProducts()
    products.value = response.data
  } catch (error) {
    showSnackbar('Error al cargar los productos', 'error')
    console.error(error)
  } finally {
    loading.value = false
  }
}

function openNewProductDialog() {
  editedIndex.value = -1
  editedItem.value = { ...defaultItem }
  dialog.value = true
  nextTick(() => {
    form.value?.resetValidation()
  })
}

function editProduct(item) {
  editedIndex.value = products.value.findIndex(p => p.id === item.id)
  editedItem.value = { ...item }
  dialog.value = true
}

function deleteProduct(item) {
  productToDelete.value = item
  deleteDialog.value = true
}

function closeDialog() {
  dialog.value = false
  nextTick(() => {
    editedItem.value = { ...defaultItem }
    editedIndex.value = -1
    form.value?.resetValidation()
  })
}

function closeDeleteDialog() {
  deleteDialog.value = false
  nextTick(() => {
    productToDelete.value = null
  })
}

async function saveProduct() {
  const { valid } = await form.value.validate()
  if (!valid) return

  saving.value = true
  // Asignar el precio calculado antes de guardar
  editedItem.value.price = parseFloat(calculatedPrice.value)

  try {
    if (editedIndex.value > -1) {
      // Editar
      const id = editedItem.value.id
      const response = await productService.updateProduct(id, editedItem.value)
      Object.assign(products.value[editedIndex.value], response.data)
      showSnackbar('Producto actualizado con éxito', 'success')
    } else {
      // Crear
      const response = await productService.createProduct(editedItem.value)
      products.value.push(response.data)
      showSnackbar('Producto creado con éxito', 'success')
    }
    closeDialog()
  } catch (error) {
    const errorMessage = error.response?.data?.message || 'Error al guardar el producto'
    showSnackbar(errorMessage, 'error')
    console.error(error)
  } finally {
    saving.value = false
  }
}

async function confirmDeleteProduct() {
  deleting.value = true
  try {
    const id = productToDelete.value.id
    await productService.deleteProduct(id)
    const index = products.value.findIndex(p => p.id === id)
    if (index > -1) {
      products.value.splice(index, 1)
    }
    showSnackbar('Producto eliminado', 'info')
  } catch (error) {
    showSnackbar('Error al eliminar el producto', 'error')
    console.error(error)
  } finally {
    deleting.value = false
    closeDeleteDialog()
  }
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
    // TODO: La moneda (VES, USD) podría ser configurable en el futuro
    return new Intl.NumberFormat('es-VE', { style: 'currency', currency: 'VES' }).format(value);
}

// --- Validation Rules ---
const rules = {
  required: value => !!value || 'Este campo es requerido.',
  positiveNumber: value => value > 0 || 'El valor debe ser mayor que cero.',
  integer: value => Number.isInteger(Number(value)) || 'Debe ser un número entero.'
}

// --- Lifecycle ---
onMounted(() => {
  fetchProducts()
})

</script>

<style scoped>
.v-card-title {
  padding: 16px 24px;
}
</style>
