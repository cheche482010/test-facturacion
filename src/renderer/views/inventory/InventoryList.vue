<template>
  <div class="text-black dark:text-white">
    <!-- Header -->
    <div class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-3xl font-bold">Control de Inventario</h1>
        <p class="text-gray-500 dark:text-gray-400">Gestiona el stock y movimientos de inventario</p>
      </div>
      <button @click="openAdjustmentDialog()" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center">
        <svg class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
        <span>Ajuste de Stock</span>
      </button>
    </div>

    <!-- Summary Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div class="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md flex items-center">
            <div class="bg-blue-500 rounded-full p-3 mr-4"><svg class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg></div>
            <div>
            <p class="text-sm text-gray-500 dark:text-gray-400">Total Productos</p>
            <p class="text-2xl font-bold">{{ summary.totalProducts }}</p>
            </div>
        </div>
        <div class="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md flex items-center">
            <div class="bg-red-500 rounded-full p-3 mr-4"><svg class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>
            <div>
            <p class="text-sm text-gray-500 dark:text-gray-400">Stock Bajo</p>
            <p class="text-2xl font-bold">{{ summary.lowStockCount }}</p>
            </div>
        </div>
        <div class="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md flex items-center">
            <div class="bg-green-500 rounded-full p-3 mr-4"><svg class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01" /></svg></div>
            <div>
            <p class="text-sm text-gray-500 dark:text-gray-400">Valor Total</p>
            <p class="text-2xl font-bold">{{ formatCurrency(summary.totalValue) }}</p>
            </div>
        </div>
        <div class="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md flex items-center">
            <div class="bg-purple-500 rounded-full p-3 mr-4"><svg class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg></div>
            <div>
            <p class="text-sm text-gray-500 dark:text-gray-400">Rotación</p>
            <p class="text-2xl font-bold">85%</p>
            </div>
        </div>
    </div>

    <!-- Tabs -->
    <div class="mb-6 border-b border-gray-200 dark:border-slate-700">
        <nav class="-mb-px flex space-x-8" aria-label="Tabs">
            <button @click="activeTab = 'inventory'" :class="[activeTab === 'inventory' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300', 'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm']">
                Inventario Actual
            </button>
            <button @click="activeTab = 'movements'" :class="[activeTab === 'movements' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300', 'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm']">
                Movimientos
            </button>
        </nav>
    </div>

    <!-- Search -->
    <div class="mb-6">
        <input type="text" v-model="search" placeholder="Buscar productos por nombre o código..." class="form-input" />
    </div>

    <!-- Inventory Table -->
    <div v-if="activeTab === 'inventory'" class="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden">
        <div class="p-4 border-b dark:border-slate-700">
            <h2 class="text-xl font-semibold">Inventario Actual ({{ filteredProducts.length }})</h2>
        </div>
        <table class="w-full text-left">
            <thead>
                <tr class="border-b dark:border-slate-700 bg-gray-50 dark:bg-slate-700/50">
                    <th class="py-3 px-4 font-semibold">Producto</th>
                    <th class="py-3 px-4 font-semibold">Código</th>
                    <th class="py-3 px-4 font-semibold">Stock Actual</th>
                    <th class="py-3 px-4 font-semibold">Stock Mín.</th>
                    <th class="py-3 px-4 font-semibold">Stock Máx.</th>
                    <th class="py-3 px-4 font-semibold">Valor Stock</th>
                    <th class="py-3 px-4 font-semibold">Estado</th>
                    <th class="py-3 px-4 font-semibold">Acciones</th>
                </tr>
            </thead>
            <tbody>
                <tr v-if="!filteredProducts.length"><td colspan="8" class="text-center py-8 text-gray-500">No se encontraron productos.</td></tr>
                <tr v-for="product in filteredProducts" :key="product.id" class="border-b dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50">
                    <td class="py-3 px-4">{{ product.name }}</td>
                    <td class="py-3 px-4">{{ product.internalCode }}</td>
                    <td class="py-3 px-4">{{ product.currentStock }} unidad</td>
                    <td class="py-3 px-4">{{ product.minStock }}</td>
                    <td class="py-3 px-4">{{ product.maxStock }}</td>
                    <td class="py-3 px-4">{{ formatCurrency(product.currentStock * product.costPrice) }}</td>
                    <td class="py-3 px-4">
                        <span class="px-2 py-1 text-xs font-semibold rounded-full" :class="getStockStatusClass(product)">
                            {{ getStockStatusText(product) }}
                        </span>
                    </td>
                    <td class="py-3 px-4">
                        <button @click="openAdjustmentDialog(product)" class="p-1 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-full">
                            <svg class="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L16.732 3.732z" /></svg>
                        </button>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>

    <!-- Movements Table -->
    <div v-if="activeTab === 'movements'" class="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden">
        <div class="p-4 border-b dark:border-slate-700">
            <h2 class="text-xl font-semibold">Historial de Movimientos ({{ filteredMovements.length }})</h2>
        </div>
        <table class="w-full text-left">
            <thead>
                <tr class="border-b dark:border-slate-700 bg-gray-50 dark:bg-slate-700/50">
                    <th class="py-3 px-4 font-semibold">Fecha</th>
                    <th class="py-3 px-4 font-semibold">Producto</th>
                    <th class="py-3 px-4 font-semibold">Tipo</th>
                    <th class="py-3 px-4 font-semibold">Cantidad</th>
                    <th class="py-3 px-4 font-semibold">Stock Anterior</th>
                    <th class="py-3 px-4 font-semibold">Stock Nuevo</th>
                    <th class="py-3 px-4 font-semibold">Usuario</th>
                </tr>
            </thead>
            <tbody>
                <tr v-if="!filteredMovements.length"><td colspan="7" class="text-center py-8 text-gray-500">No se encontraron movimientos.</td></tr>
                <tr v-for="movement in filteredMovements" :key="movement.id" class="border-b dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50">
                    <td class="py-3 px-4">{{ new Date(movement.movementDate).toLocaleString() }}</td>
                    <td class="py-3 px-4">{{ productsById[movement.productId]?.name || 'N/A' }}</td>
                    <td class="py-3 px-4">{{ movement.movementType }}</td>
                    <td class="py-3 px-4">{{ movement.quantity }}</td>
                    <td class="py-3 px-4">{{ movement.previousStock }}</td>
                    <td class="py-3 px-4">{{ movement.newStock }}</td>
                    <td class="py-3 px-4">{{ movement.user?.firstName || 'N/A' }}</td>
                </tr>
            </tbody>
        </table>
    </div>


    <!-- Dialogs -->
    <StockAdjustmentDialog
      v-model="adjustmentDialog"
      :product="selectedProduct"
      @saved="onAdjustmentSaved"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import StockAdjustmentDialog from '../../components/inventory/StockAdjustmentDialog.vue'
import { useInventoryStore } from '../../stores/inventory'
import { useProductStore } from '../../stores/products'

const inventoryStore = useInventoryStore()
const productStore = useProductStore()

const loading = ref(false)
const search = ref('')
const activeTab = ref('inventory')
const adjustmentDialog = ref(false)
const selectedProduct = ref(null)

const products = computed(() => productStore.products)

const summary = computed(() => {
    return {
        totalProducts: products.value.length,
        lowStockCount: products.value.filter(p => p.currentStock > 0 && p.currentStock <= p.minStock).length,
        totalValue: products.value.reduce((sum, p) => sum + (p.currentStock * p.costPrice), 0),
    }
})

const filteredProducts = computed(() => {
    if (!search.value) return products.value;
    const s = search.value.toLowerCase();
    return products.value.filter(p => p.name.toLowerCase().includes(s) || p.internalCode?.toLowerCase().includes(s));
})

const productsById = computed(() => Object.fromEntries(products.value.map(p => [p.id, p])));
const movements = computed(() => inventoryStore.movements);

const filteredMovements = computed(() => {
    if (!search.value) return movements.value;
    const s = search.value.toLowerCase();
    // This requires product names, so we need to map product data to movements
    const productsById = Object.fromEntries(products.value.map(p => [p.id, p]));
    return movements.value.filter(m => {
        const product = productsById[m.productId];
        return product && (product.name.toLowerCase().includes(s) || product.internalCode?.toLowerCase().includes(s));
    });
});

const loadData = async () => {
    loading.value = true;
    try {
        await productStore.fetchProducts();
        await inventoryStore.fetchMovements();
    } catch (error) {
        console.error('Error loading inventory data:', error);
    } finally {
        loading.value = false;
    }
}

const openAdjustmentDialog = (product = null) => {
  selectedProduct.value = product
  adjustmentDialog.value = true
}

const onAdjustmentSaved = () => {
  adjustmentDialog.value = false
  selectedProduct.value = null
  loadData()
}


const formatCurrency = (amount) => {
    if (typeof amount !== 'number') return '$0.00';
    return amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

const getStockStatusClass = (product) => {
  if (product.currentStock === 0) return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300';
  if (product.currentStock <= product.minStock) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300';
  return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
};

const getStockStatusText = (product) => {
  if (product.currentStock === 0) return 'Agotado';
  if (product.currentStock <= product.minStock) return 'Stock Bajo';
  return 'Normal';
};

onMounted(loadData)
</script>

<style scoped>
.form-input {
  @apply w-full px-3 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm;
}
</style>
