<template>
  <div>
    <v-row class="mb-4">
      <v-col cols="12" md="6">
        <h1 class="text-h4">Control de Inventario</h1>
      </v-col>
      <v-col cols="12" md="6" class="text-right">
        <v-btn
          color="primary"
          @click="openAdjustmentDialog()"
          prepend-icon="mdi-package-variant-plus"
          class="mr-2"
        >
          Ajuste de Stock
        </v-btn>
        <v-btn
          color="success"
          @click="openMovementDialog()"
          prepend-icon="mdi-swap-horizontal"
        >
          Nuevo Movimiento
        </v-btn>
      </v-col>
    </v-row>

    <!-- Alertas de stock -->
    <v-row class="mb-4">
      <v-col cols="12">
        <v-alert
          type="warning"
          variant="tonal"
          closable
          @click:close="dismissAlerts"
        >
          <v-alert-title>Alertas de Inventario</v-alert-title>
          <div class="mt-2">
            <v-chip
              v-for="alert in alerts"
              :key="alert.id"
              size="small"
              color="warning"
              class="mr-2 mb-1"
            >
              {{ alert.name }}: {{ alert.currentStock }} {{ alert.unit }}
            </v-chip>
          </div>
        </v-alert>
      </v-col>
    </v-row>

    <!-- Resumen de inventario -->
    <v-row class="mb-4">
      <v-col cols="12" md="3">
        <v-card>
          <v-card-text>
            <div class="d-flex align-center">
              <v-icon color="primary" size="40" class="mr-3">mdi-package-variant</v-icon>
              <div>
                <div class="text-h6">{{ totalProducts }}</div>
                <div class="text-caption">Total Productos</div>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      
      <v-col cols="12" md="3">
        <v-card>
          <v-card-text>
            <div class="d-flex align-center">
              <v-icon color="success" size="40" class="mr-3">mdi-check-circle</v-icon>
              <div>
                <div class="text-h6">{{ productsInStock }}</div>
                <div class="text-caption">En Stock</div>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      
      <v-col cols="12" md="3">
        <v-card>
          <v-card-text>
            <div class="d-flex align-center">
              <v-icon color="warning" size="40" class="mr-3">mdi-alert</v-icon>
              <div>
                <div class="text-h6">{{ lowStockCount }}</div>
                <div class="text-caption">Stock Bajo</div>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      
      <v-col cols="12" md="3">
        <v-card>
          <v-card-text>
            <div class="d-flex align-center">
              <v-icon color="error" size="40" class="mr-3">mdi-close-circle</v-icon>
              <div>
                <div class="text-h6">{{ outOfStockCount }}</div>
                <div class="text-caption">Sin Stock</div>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Filtros -->
    <v-card class="mb-4">
      <v-card-text>
        <v-row>
          <v-col cols="12" md="4">
            <v-text-field
              v-model="search"
              label="Buscar productos"
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              density="compact"
              clearable
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-select
              v-model="selectedCategory"
              :items="categories"
              item-title="name"
              item-value="id"
              label="Categoría"
              variant="outlined"
              density="compact"
              clearable
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-select
              v-model="stockFilter"
              :items="stockFilterOptions"
              label="Filtro de Stock"
              variant="outlined"
              density="compact"
              clearable
            />
          </v-col>
          <v-col cols="12" md="2">
            <v-btn
              icon="mdi-refresh"
              @click="loadInventory"
              variant="outlined"
            />
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Tabla de inventario -->
    <v-card>
      <v-data-table
        :headers="headers"
        :items="filteredProducts"
        :loading="loading"
        :search="search"
        class="elevation-1"
      >
        <template v-slot:item.name="{ item }">
          <div>
            <div class="font-weight-medium">{{ item.name }}</div>
            <div class="text-caption text-medium-emphasis">
              {{ item.internalCode }}
            </div>
          </div>
        </template>

        <template v-slot:item.category="{ item }">
          <v-chip
            v-if="item.category"
            size="small"
            color="primary"
            variant="tonal"
          >
            {{ item.category.name }}
          </v-chip>
        </template>

        <template v-slot:item.currentStock="{ item }">
          <div class="d-flex align-center">
            <v-chip
              :color="getStockColor(item)"
              size="small"
              variant="tonal"
              class="mr-2"
            >
              {{ item.currentStock }} {{ item.unit }}
            </v-chip>
            <v-progress-linear
              :model-value="getStockPercentage(item)"
              :color="getStockColor(item)"
              height="4"
              class="flex-grow-1"
            />
          </div>
        </template>

        <template v-slot:item.stockLimits="{ item }">
          <div class="text-caption">
            <div>Mín: {{ item.minStock }}</div>
            <div>Máx: {{ item.maxStock }}</div>
          </div>
        </template>

        <template v-slot:item.value="{ item }">
          <div class="text-right">
            <div class="font-weight-medium">
              {{ formatCurrency(item.currentStock * item.costPrice) }}
            </div>
            <div class="text-caption text-medium-emphasis">
              {{ formatCurrency(item.costPrice) }}/{{ item.unit }}
            </div>
          </div>
        </template>

        <template v-slot:item.lastMovement="{ item }">
          <div class="text-caption">
            {{ formatDate(item.lastMovementDate) }}
          </div>
        </template>

        <template v-slot:item.actions="{ item }">
          <v-btn
            icon="mdi-history"
            size="small"
            variant="text"
            @click="viewMovements(item)"
          />
          <v-btn
            icon="mdi-pencil"
            size="small"
            variant="text"
            @click="openAdjustmentDialog(item)"
          />
          <v-btn
            icon="mdi-plus"
            size="small"
            variant="text"
            color="success"
            @click="quickAdjustment(item, 'add')"
          />
          <v-btn
            icon="mdi-minus"
            size="small"
            variant="text"
            color="error"
            @click="quickAdjustment(item, 'subtract')"
          />
        </template>
      </v-data-table>
    </v-card>

    <!-- Dialog de ajuste de stock -->
    <StockAdjustmentDialog
      v-model="adjustmentDialog"
      :product="selectedProduct"
      @saved="onAdjustmentSaved"
    />

    <!-- Dialog de movimiento de inventario -->
    <InventoryMovementDialog
      v-model="movementDialog"
      @saved="onMovementSaved"
    />

    <!-- Dialog de historial de movimientos -->
    <MovementHistoryDialog
      v-model="historyDialog"
      :product="selectedProduct"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import StockAdjustmentDialog from '../../components/inventory/StockAdjustmentDialog.vue'
import InventoryMovementDialog from '../../components/inventory/InventoryMovementDialog.vue'
import MovementHistoryDialog from '../../components/inventory/MovementHistoryDialog.vue'
import { useInventoryStore } from '../../stores/inventory'
import { useProductStore } from '../../stores/products'
import { useCategoryStore } from '../../stores/categories'

const inventoryStore = useInventoryStore()
const productStore = useProductStore()
const categoryStore = useCategoryStore()

// Estado reactivo
const loading = ref(false)
const search = ref('')
const selectedCategory = ref(null)
const stockFilter = ref(null)
const adjustmentDialog = ref(false)
const movementDialog = ref(false)
const historyDialog = ref(false)
const selectedProduct = ref(null)

// Opciones de filtros
const stockFilterOptions = [
  { title: 'Todos', value: null },
  { title: 'Stock bajo', value: 'low' },
  { title: 'Sin stock', value: 'empty' },
  { title: 'Stock normal', value: 'normal' },
  { title: 'Sobre stock', value: 'over' }
]

// Headers de la tabla
const headers = [
  { title: 'Producto', key: 'name', sortable: true },
  { title: 'Categoría', key: 'category', sortable: false },
  { title: 'Stock Actual', key: 'currentStock', sortable: true },
  { title: 'Límites', key: 'stockLimits', sortable: false },
  { title: 'Valor', key: 'value', sortable: true },
  { title: 'Último Mov.', key: 'lastMovement', sortable: true },
  { title: 'Acciones', key: 'actions', sortable: false, width: '160px' }
]

// Computed properties
const products = computed(() => productStore.products)
const categories = computed(() => categoryStore.categories)

const filteredProducts = computed(() => {
  let filtered = products.value

  if (selectedCategory.value) {
    filtered = filtered.filter(p => p.categoryId === selectedCategory.value)
  }

  if (stockFilter.value) {
    switch (stockFilter.value) {
      case 'low':
        filtered = filtered.filter(p => p.currentStock <= p.minStock && p.currentStock > 0)
        break
      case 'empty':
        filtered = filtered.filter(p => p.currentStock === 0)
        break
      case 'normal':
        filtered = filtered.filter(p => p.currentStock > p.minStock && p.currentStock <= p.maxStock)
        break
      case 'over':
        filtered = filtered.filter(p => p.currentStock > p.maxStock)
        break
    }
  }

  return filtered
})

const totalProducts = computed(() => products.value.length)
const productsInStock = computed(() => products.value.filter(p => p.currentStock > 0).length)
const lowStockCount = computed(() => products.value.filter(p => p.currentStock <= p.minStock && p.currentStock > 0).length)
const outOfStockCount = computed(() => products.value.filter(p => p.currentStock === 0).length)

const alerts = computed(() => {
  return products.value.filter(p => p.currentStock <= p.minStock && p.currentStock >= 0)
})

// Métodos
const loadInventory = async () => {
  loading.value = true
  try {
    await productStore.fetchProducts()
    await categoryStore.fetchCategories()
    await inventoryStore.fetchMovements()
  } catch (error) {
    console.error('Error cargando inventario:', error)
  } finally {
    loading.value = false
  }
}

const openAdjustmentDialog = (product = null) => {
  selectedProduct.value = product
  adjustmentDialog.value = true
}

const openMovementDialog = () => {
  movementDialog.value = true
}

const viewMovements = (product) => {
  selectedProduct.value = product
  historyDialog.value = true
}

const quickAdjustment = async (product, action) => {
  const quantity = action === 'add' ? 1 : -1
  const newStock = Math.max(0, product.currentStock + quantity)
  
  try {
    await inventoryStore.adjustStock(product.id, newStock, 'ajuste_rapido')
    await loadInventory()
  } catch (error) {
    console.error('Error en ajuste rápido:', error)
  }
}

const onAdjustmentSaved = () => {
  adjustmentDialog.value = false
  selectedProduct.value = null
  loadInventory()
}

const onMovementSaved = () => {
  movementDialog.value = false
  loadInventory()
}

const dismissAlerts = () => {
  // Implementar lógica para marcar alertas como vistas
}

const getStockColor = (product) => {
  if (product.currentStock === 0) return 'error'
  if (product.currentStock <= product.minStock) return 'warning'
  if (product.currentStock > product.maxStock) return 'info'
  return 'success'
}

const getStockPercentage = (product) => {
  if (product.maxStock === 0) return 0
  return Math.min(100, (product.currentStock / product.maxStock) * 100)
}

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('es-VE', {
    style: 'currency',
    currency: 'VES'
  }).format(amount)
}

const formatDate = (date) => {
  if (!date) return 'N/A'
  return new Date(date).toLocaleDateString('es-VE')
}

// Lifecycle
onMounted(() => {
  loadInventory()
})
</script>
