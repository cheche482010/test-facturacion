import { ref, computed, onMounted } from 'vue'
import { useProductStore } from '../../stores/products'
import { useInventoryStore } from '../../stores/inventory'
import { formatCurrency } from '@/utils/formatters'
// Adjustment dialog will be needed, assuming it exists or will be created
// import StockAdjustmentDialog from '@/components/inventory/StockAdjustmentDialog/StockAdjustmentDialog.vue'

export default {
  // components: { StockAdjustmentDialog },
  setup() {
    const productStore = useProductStore()
    const inventoryStore = useInventoryStore()

    // State
    const loading = ref(false)
    const search = ref('')
    const tab = ref('inventory') // Default to inventory tab
    const adjustmentDialog = ref(false)
    const selectedProduct = ref(null)

    // Computed Properties
    const products = computed(() => productStore.products)

    const summaryCards = computed(() => {
      const allProducts = products.value || []
      const totalProducts = allProducts.length
      const lowStockProducts = allProducts.filter(p => p.currentStock > 0 && p.currentStock <= p.minStock).length
      const inventoryValue = allProducts.reduce((sum, p) => sum + (p.costPrice * p.currentStock), 0)

      // The "Rotación" value is complex. Using a placeholder for now.
      const rotation = '85%'

      return [
        { title: 'Total Productos', value: totalProducts, icon: 'mdi-package-variant-closed', color: 'blue-grey' },
        { title: 'Stock Bajo', value: lowStockProducts, icon: 'mdi-alert-outline', color: 'orange' },
        { title: 'Valor Total', value: formatCurrency(inventoryValue), icon: 'mdi-cash-multiple', color: 'deep-purple' },
        { title: 'Rotación', value: rotation, icon: 'mdi-sync', color: 'indigo' }
      ]
    })

    const filteredProducts = computed(() => {
      let filtered = products.value
      const searchTerm = search.value?.toLowerCase() || ''

      if (searchTerm) {
        filtered = filtered.filter(p =>
          p.name.toLowerCase().includes(searchTerm) ||
          (p.internalCode && p.internalCode.toLowerCase().includes(searchTerm))
        )
      }
      return filtered
    })

    const inventoryHeaders = [
      { title: 'Producto', key: 'name', sortable: true },
      { title: 'Código', key: 'internalCode', sortable: true },
      { title: 'Stock Actual', key: 'currentStock', sortable: true, align: 'center' },
      { title: 'Stock Mín.', key: 'minStock', sortable: true, align: 'center' },
      { title: 'Stock Máx.', key: 'maxStock', sortable: true, align: 'center' },
      { title: 'Valor Stock', key: 'stockValue', sortable: true, align: 'end' },
      { title: 'Estado', key: 'status', sortable: true, align: 'center' },
      { title: 'Acciones', key: 'actions', sortable: false, align: 'center' }
    ]

    // Methods
    const loadInventory = async () => {
      loading.value = true
      try {
        await productStore.fetchProducts()
        // We might need movements for the other tab later
        // await inventoryStore.fetchMovements()
      } catch (error) {
        console.error('Error loading inventory:', error)
      } finally {
        loading.value = false
      }
    }

    const openAdjustmentDialog = (product = null) => {
      selectedProduct.value = product
      adjustmentDialog.value = true
      console.log("Adjustment dialog should open for:", product)
    }

    const onAdjustmentSaved = async () => {
      adjustmentDialog.value = false
      selectedProduct.value = null
      await loadInventory()
    }

    const getStockStatusText = (product) => {
      if (product.currentStock === 0) return 'Sin Stock'
      if (product.currentStock <= product.minStock) return 'Stock Bajo'
      if (product.currentStock > product.maxStock) return 'Sobre Stock'
      return 'Normal'
    }

    const getStockStatusColor = (product) => {
      const status = getStockStatusText(product)
      const colors = {
        'Sin Stock': 'error',
        'Stock Bajo': 'warning',
        'Sobre Stock': 'info',
        'Normal': 'success'
      }
      return colors[status]
    }

    // Lifecycle
    onMounted(loadInventory)

    return {
      loading,
      search,
      tab,
      adjustmentDialog,
      selectedProduct,
      summaryCards,
      filteredProducts,
      inventoryHeaders,
      loadInventory,
      openAdjustmentDialog,
      onAdjustmentSaved,
      getStockStatusText,
      getStockStatusColor,
      formatCurrency
    }
  }
}