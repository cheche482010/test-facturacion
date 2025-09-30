import { ref, computed, onMounted } from 'vue'
import StockAdjustmentDialog from '@/components/inventory/StockAdjustmentDialog/StockAdjustmentDialog.vue'
import InventoryMovementDialog from '@/components/inventory/InventoryMovementDialog/InventoryMovementDialog.vue'
import MovementHistoryDialog from '@/components/inventory/MovementHistoryDialog/MovementHistoryDialog.vue'
import { useInventoryStore } from '@/stores/inventory'
import { useProductStore } from '@/stores/products'
import { useCategoryStore } from '@/stores/categories'

export default {
  components: {
    StockAdjustmentDialog,
    InventoryMovementDialog,
    MovementHistoryDialog
  },
  setup() {
    const inventoryStore = useInventoryStore()
    const productStore = useProductStore()
    const categoryStore = useCategoryStore()

    const loading = ref(false)
    const search = ref('')
    const selectedCategory = ref(null)
    const stockFilter = ref(null)
    const adjustmentDialog = ref(false)
    const movementDialog = ref(false)
    const historyDialog = ref(false)
    const selectedProduct = ref(null)

    const stockFilterOptions = [
      { title: 'Todos', value: null },
      { title: 'Stock bajo', value: 'low' },
      { title: 'Sin stock', value: 'empty' },
      { title: 'Stock normal', value: 'normal' },
      { title: 'Sobre stock', value: 'over' }
    ]

    const headers = [
      { title: 'Producto', key: 'name', sortable: true },
      { title: 'Categoría', key: 'category', sortable: false },
      { title: 'Stock Actual', key: 'currentStock', sortable: true },
      { title: 'Límites', key: 'stockLimits', sortable: false },
      { title: 'Valor', key: 'value', sortable: true },
      { title: 'Último Mov.', key: 'lastMovement', sortable: true },
      { title: 'Acciones', key: 'actions', sortable: false, width: '160px' }
    ]

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

    onMounted(() => {
      loadInventory()
    })

    return {
      loading,
      search,
      selectedCategory,
      stockFilter,
      adjustmentDialog,
      movementDialog,
      historyDialog,
      selectedProduct,
      stockFilterOptions,
      headers,
      products,
      categories,
      filteredProducts,
      totalProducts,
      productsInStock,
      lowStockCount,
      outOfStockCount,
      alerts,
      loadInventory,
      openAdjustmentDialog,
      openMovementDialog,
      viewMovements,
      quickAdjustment,
      onAdjustmentSaved,
      onMovementSaved,
      dismissAlerts,
      getStockColor,
      getStockPercentage,
      formatCurrency,
      formatDate
    }
  }
}