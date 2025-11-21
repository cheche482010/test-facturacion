import { ref, computed, onMounted } from 'vue'
import { useProductStore } from '../../stores/products'
import { useInventoryStore } from '../../stores/inventory'
import { formatCurrency } from '@/utils/formatters'

export default {
  setup() {
    const productStore = useProductStore()
    const inventoryStore = useInventoryStore()

    const loading = ref(false)
    const search = ref('')
    const statusFilter = ref('Todos')
    const statusOptions = ['Todos', 'Normal', 'Stock Bajo', 'Sobre Stock', 'Sin Stock']
    const valueFilter = ref('Cualquiera')
    const valueOptions = ['Cualquiera', 'Con valor', 'Sin valor']
    const tab = ref('inventory')
    const adjustmentDialog = ref(false)
    const productDetailsDialog = ref(false)
    const movementDetailsDialog = ref(false)
    const selectedProduct = ref(null)
    const selectedMovement = ref(null)
    const loadingMovements = ref(false)
    const searchMovement = ref('')
    const movementTypeFilter = ref('Todos')
    const movementTypeOptions = ['Todos', 'Entrada', 'Salida', 'Ajuste']
    const startDate = ref('')
    const endDate = ref('')
    const movements = ref([])

    const products = computed(() => productStore.products)

    const summaryCards = computed(() => {
      const allProducts = products.value || []
      const totalProducts = allProducts.length
      const lowStockProducts = allProducts.filter(p => p.currentStock > 0 && p.currentStock <= 5).length
      const inventoryValue = allProducts.reduce((sum, p) => sum + (p.costPrice * p.currentStock), 0)

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

      if (statusFilter.value && statusFilter.value !== 'Todos') {
        filtered = filtered.filter(p => getStockStatusText(p) === statusFilter.value)
      }

      if (valueFilter.value === 'Con valor') {
        filtered = filtered.filter(p => (p.costPrice * p.currentStock) > 0)
      } else if (valueFilter.value === 'Sin valor') {
        filtered = filtered.filter(p => (p.costPrice * p.currentStock) === 0)
      }

      return filtered
    })

    const filteredMovements = computed(() => {
      let filtered = movements.value
      const searchTerm = searchMovement.value?.toLowerCase() || ''

      if (searchTerm) {
        filtered = filtered.filter(m =>
          m.product?.name.toLowerCase().includes(searchTerm) ||
          m.product?.internalCode?.toLowerCase().includes(searchTerm)
        )
      }

      if (movementTypeFilter.value && movementTypeFilter.value !== 'Todos') {
        const typeMap = {
          'Entrada': 'entrada',
          'Salida': 'salida',
          'Ajuste': 'ajuste'
        }
        filtered = filtered.filter(m => m.movementType === typeMap[movementTypeFilter.value])
      }

      if (startDate.value) {
        filtered = filtered.filter(m => new Date(m.movementDate) >= new Date(startDate.value))
      }

      if (endDate.value) {
        filtered = filtered.filter(m => new Date(m.movementDate) <= new Date(endDate.value))
      }

      return filtered
    })

    const inventoryHeaders = [
      { title: 'Producto', key: 'name', sortable: true },
      { title: 'Código', key: 'internalCode', sortable: true },
      { title: 'Stock Actual', key: 'currentStock', sortable: true, align: 'center' },
      { title: 'Valor Stock', key: 'stockValue', sortable: true, align: 'end' },
      { title: 'Estado', key: 'status', sortable: true, align: 'center' },
      { title: 'Acciones', key: 'actions', sortable: false, align: 'center' }
    ]

    const loadInventory = async () => {
      loading.value = true
      try {
        await productStore.fetchProducts()
      } catch (error) {
        console.error('Error loading inventory:', error)
      } finally {
        loading.value = false
      }
    }

    const loadMovements = async () => {
      loadingMovements.value = true
      try {
        const result = await inventoryStore.fetchMovements()
        movements.value = result || []
      } catch (error) {
        console.error('Error loading movements:', error)
        movements.value = []
      } finally {
        loadingMovements.value = false
      }
    }

    const openAdjustmentDialog = (product = null) => {
      selectedProduct.value = product
      adjustmentDialog.value = true
    }

    const onAdjustmentSaved = async () => {
      adjustmentDialog.value = false
      selectedProduct.value = null
      await loadInventory()
      await loadMovements()
    }

    const deleteProduct = async (product) => {
      if (confirm(`¿Estás seguro de que quieres eliminar "${product.name}"?`)) {
        try {
          await productStore.deleteProduct(product.id)
          await loadInventory()
        } catch (error) {
          console.error('Error deleting product:', error)
        }
      }
    }

    const viewProductDetails = (product) => {
      selectedProduct.value = product
      productDetailsDialog.value = true
    }

    const closeProductDetailsDialog = () => {
      productDetailsDialog.value = false
      selectedProduct.value = null
    }

    const viewMovementDetails = (movement) => {
      selectedMovement.value = movement
      movementDetailsDialog.value = true
    }

    const closeMovementDetailsDialog = () => {
      movementDetailsDialog.value = false
      selectedMovement.value = null
    }

    const getMovementTypeText = (type) => {
      const types = {
        'entrada': 'Entrada',
        'salida': 'Salida',
        'ajuste': 'Ajuste'
      }
      return types[type] || type
    }

    const getMovementTypeColor = (type) => {
      const colors = {
        'entrada': 'success',
        'salida': 'error',
        'ajuste': 'warning'
      }
      return colors[type] || 'info'
    }

    const formatDate = (date) => {
      return new Date(date).toLocaleDateString('es-ES')
    }

    const getStockStatusText = (product) => {
      if (product.currentStock === 0) return 'Sin Stock'
      if (product.currentStock <= 5) return 'Stock Bajo'
      if (product.currentStock > 100) return 'Sobre Stock'
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

    onMounted(async () => {
      await loadInventory()
      await loadMovements()
    })

    const movementHeaders = [
      { title: 'Producto', key: 'product', sortable: true },
      { title: 'Tipo', key: 'movementType', sortable: true, align: 'center' },
      { title: 'Cantidad', key: 'quantity', sortable: true, align: 'center' },
      { title: 'Precio', key: 'priceInfo', sortable: false, align: 'end' },
      { title: 'Fecha', key: 'movementDate', sortable: true, align: 'center' },
      { title: 'Acciones', key: 'actions', sortable: false, align: 'center' }
    ]

    return {
      loading,
      search,
      statusFilter,
      statusOptions,
      valueFilter,
      valueOptions,
      tab,
      adjustmentDialog,
      productDetailsDialog,
      movementDetailsDialog,
      selectedProduct,
      selectedMovement,
      loadingMovements,
      searchMovement,
      movementTypeFilter,
      movementTypeOptions,
      startDate,
      endDate,
      movements,
      summaryCards,
      filteredProducts,
      filteredMovements,
      inventoryHeaders,
      movementHeaders,
      loadInventory,
      loadMovements,
      openAdjustmentDialog,
      onAdjustmentSaved,
      deleteProduct,
      viewProductDetails,
      closeProductDetailsDialog,
      viewMovementDetails,
      closeMovementDetailsDialog,
      getStockStatusText,
      getStockStatusColor,
      getMovementTypeText,
      getMovementTypeColor,
      formatDate,
      formatCurrency
    }
  }
}
