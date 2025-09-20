<template>
  <div class="text-black dark:text-white">
    <!-- Header -->
    <div class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-3xl font-bold">Gestión de Productos</h1>
        <p class="text-gray-500 dark:text-gray-400">Administra tu catálogo de productos y controla el inventario</p>
      </div>
      <button @click="openProductDialog()" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center">
        <svg class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
        <span>Nuevo Producto</span>
      </button>
    </div>

    <!-- Summary Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      <div class="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md flex items-center">
        <div class="bg-blue-500 rounded-full p-3 mr-4">
          <svg class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
        </div>
        <div>
          <p class="text-sm text-gray-500 dark:text-gray-400">Total Productos</p>
          <p class="text-2xl font-bold">{{ summary.totalProducts }}</p>
        </div>
      </div>
      <div class="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md flex items-center">
        <div class="bg-green-500 rounded-full p-3 mr-4">
          <svg class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </div>
        <div>
          <p class="text-sm text-gray-500 dark:text-gray-400">Productos Activos</p>
          <p class="text-2xl font-bold">{{ summary.activeProducts }}</p>
        </div>
      </div>
      <div class="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md flex items-center">
        <div class="bg-yellow-500 rounded-full p-3 mr-4">
          <svg class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </div>
        <div>
          <p class="text-sm text-gray-500 dark:text-gray-400">Stock Bajo</p>
          <p class="text-2xl font-bold">{{ summary.lowStockProducts }}</p>
        </div>
      </div>
      <div class="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md flex items-center">
        <div class="bg-purple-500 rounded-full p-3 mr-4">
          <svg class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01" /></svg>
        </div>
        <div>
          <p class="text-sm text-gray-500 dark:text-gray-400">Valor Total</p>
          <p class="text-2xl font-bold">{{ formatCurrency(summary.totalValue) }}</p>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-md mb-6">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <input type="text" v-model="search" placeholder="Buscar por nombre, código o código de barras..." class="md:col-span-2 form-input" />
        <select v-model="selectedCategory" class="form-input">
          <option :value="null">Todas las Categorías</option>
          <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
        </select>
        <select v-model="selectedStatus" class="form-input">
          <option :value="null">Todos los Estados</option>
          <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">{{ opt.title }}</option>
        </select>
        <div class="flex items-center">
          <input type="checkbox" v-model="lowStockFilter" id="low-stock" class="form-checkbox" />
          <label for="low-stock" class="ml-2">Solo stock bajo</label>
        </div>
      </div>
    </div>

    <!-- Products Table -->
    <div class="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden">
        <div class="p-4 border-b dark:border-slate-700">
            <h2 class="text-xl font-semibold">Lista de Productos ({{ filteredProducts.length }})</h2>
        </div>
      <table class="w-full text-left">
        <thead>
          <tr class="border-b dark:border-slate-700 bg-gray-50 dark:bg-slate-700/50">
            <th class="py-3 px-4 font-semibold">Producto</th>
            <th class="py-3 px-4 font-semibold">Código</th>
            <th class="py-3 px-4 font-semibold">Categoría</th>
            <th class="py-3 px-4 font-semibold">Stock</th>
            <th class="py-3 px-4 font-semibold">Precio Venta</th>
            <th class="py-3 px-4 font-semibold">Estado</th>
            <th class="py-3 px-4 font-semibold">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!filteredProducts.length">
            <td colspan="7" class="text-center py-8 text-gray-500">No se encontraron productos.</td>
          </tr>
          <tr v-for="product in filteredProducts" :key="product.id" class="border-b dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50">
            <td class="py-3 px-4">
                <div>{{ product.name }}</div>
                <div class="text-xs text-gray-500">{{ product.brand }}</div>
            </td>
            <td class="py-3 px-4">{{ product.internalCode }}</td>
            <td class="py-3 px-4">{{ product.category?.name || 'N/A' }}</td>
            <td class="py-3 px-4">
                <span class="px-2 py-1 text-xs rounded-full" :class="getStockClass(product)">
                    {{ product.currentStock }}
                </span>
            </td>
            <td class="py-3 px-4">{{ formatCurrency(product.retailPrice) }}</td>
            <td class="py-3 px-4">
              <span class="px-2 py-1 text-xs font-semibold rounded-full" :class="getStatusClass(product.status)">
                {{ getStatusText(product.status) }}
              </span>
            </td>
            <td class="py-3 px-4">
              <div class="flex items-center space-x-2">
                <button @click="openProductDialog(product)" class="p-1 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-full">
                    <svg class="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L16.732 3.732z" /></svg>
                </button>
                <button @click="confirmDelete(product)" class="p-1 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-full">
                    <svg class="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Dialogs (kept from original for functionality) -->
    <ProductDialog
      v-model="productDialog"
      :product="selectedProduct"
      :categories="categories"
      @saved="onProductSaved"
    />
    <BaseDialog v-model="deleteDialog" max-width="400">
      <template #title>Confirmar eliminación</template>
      <p>¿Está seguro que desea eliminar el producto "{{ productToDelete?.name }}"?</p>
      <template #actions>
        <button @click="deleteDialog = false" class="px-4 py-2 rounded-lg bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600">Cancelar</button>
        <button @click="deleteProduct" class="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700">Eliminar</button>
      </template>
    </BaseDialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import ProductDialog from '../../components/products/ProductDialog.vue'
import BaseDialog from '../../components/ui/BaseDialog.vue'
import { useProductStore } from '../../stores/products'
import { useCategoryStore } from '../../stores/categories'

const productStore = useProductStore()
const categoryStore = useCategoryStore()

// State
const loading = ref(false)
const search = ref('')
const selectedCategory = ref(null)
const selectedStatus = ref(null)
const lowStockFilter = ref(false)
const productDialog = ref(false)
const deleteDialog = ref(false)
const selectedProduct = ref(null)
const productToDelete = ref(null)

// Filter options
const statusOptions = [
  { title: 'Activo', value: 'activo' },
  { title: 'Descontinuado', value: 'descontinuado' },
  { title: 'Agotado', value: 'agotado' }
]

// Computed
const products = computed(() => productStore.products)
const categories = computed(() => categoryStore.categories)

const summary = computed(() => {
    const allProducts = products.value;
    return {
        totalProducts: allProducts.length,
        activeProducts: allProducts.filter(p => p.status === 'activo').length,
        lowStockProducts: allProducts.filter(p => p.currentStock > 0 && p.currentStock <= p.minStock).length,
        totalValue: allProducts.reduce((sum, p) => sum + (p.currentStock * p.costPrice), 0)
    }
})

const filteredProducts = computed(() => {
  let filtered = products.value

  if (search.value) {
      const s = search.value.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(s) ||
        p.internalCode?.toLowerCase().includes(s) ||
        p.barcode?.toLowerCase().includes(s)
    );
  }

  if (selectedCategory.value) {
    filtered = filtered.filter(p => p.categoryId === selectedCategory.value)
  }

  if (selectedStatus.value) {
    filtered = filtered.filter(p => p.status === selectedStatus.value)
  }

  if (lowStockFilter.value) {
    filtered = filtered.filter(p => p.currentStock > 0 && p.currentStock <= p.minStock)
  }

  return filtered
})

// Methods
const loadData = async () => {
  loading.value = true
  try {
    await productStore.fetchProducts()
    await categoryStore.fetchCategories()
  } catch (error) {
    console.error('Error loading data:', error)
  } finally {
    loading.value = false
  }
}

const openProductDialog = (product = null) => {
  selectedProduct.value = product
  productDialog.value = true
}

const onProductSaved = () => {
  productDialog.value = false
  selectedProduct.value = null
  loadData()
}

const confirmDelete = (product) => {
  productToDelete.value = product
  deleteDialog.value = true
}

const deleteProduct = async () => {
  if (!productToDelete.value) return;
  try {
    await productStore.deleteProduct(productToDelete.value.id)
    deleteDialog.value = false
    productToDelete.value = null
    loadData()
  } catch (error) {
    console.error('Error deleting product:', error)
  }
}

const getStockClass = (product) => {
  if (product.currentStock === 0) return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300';
  if (product.currentStock <= product.minStock) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300';
  return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
};

const getStatusClass = (status) => {
  const classes = {
    activo: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
    descontinuado: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    agotado: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
  };
  return classes[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
};

const getStatusText = (status) => {
  const texts = { activo: 'Activo', descontinuado: 'Descontinuado', agotado: 'Agotado' };
  return texts[status] || status;
};

const formatCurrency = (amount) => {
    if (typeof amount !== 'number') return '$0.00';
    return amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

// Lifecycle
onMounted(() => {
  loadData()
})
</script>

<style scoped>
.form-input {
  @apply w-full px-3 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm;
}
.form-checkbox {
  @apply h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500;
}
</style>
