import { ref, computed, onMounted, watch } from 'vue'
import ProductDialog from '../../components/products/ProductDialog/ProductDialog.vue'
import { useProductStore } from '../../stores/products'
import { useCategoryStore } from '../../stores/categories'
import { useAuthStore } from '../../stores/auth'
import { formatCurrency } from '@/utils/formatters'

export default {
  components: {
    ProductDialog
  },
  setup() {
    const productStore = useProductStore()
    const categoryStore = useCategoryStore()
    const authStore = useAuthStore()

    const loading = ref(false)
    const search = ref('')
    const selectedCategory = ref(null)
    const selectedStatus = ref(null)
    const stockFilter = ref(false)
    const viewMode = ref('list')
    const currentPage = ref(1)
    const itemsPerPage = 18
    const productDialog = ref(false)
    const deleteDialog = ref(false)
    const barcodeDialog = ref(false)
    const imageDialog = ref(false)
    const productDetailsDialog = ref(false)
    const selectedProduct = ref(null)
    const productToDelete = ref(null)
    const selectedProductImage = ref(null)
    const selectedProductForDetails = ref(null)
    const currentDolarRate = ref(null)
    const loadingDolarRate = ref(false)

    const isCajero = computed(() => authStore.user?.role === 'cajero')

    const statusOptions = [
      { title: 'Todos', value: null },
      { title: 'Activo', value: 'activo' },
      { title: 'Descontinuado', value: 'descontinuado' },
      { title: 'Agotado', value: 'agotado' },
    ]

    const headers = [
      { title: 'Imagen', key: 'image', sortable: false, align: 'center' },
      { title: 'Producto', key: 'name', sortable: true },
      { title: 'Código', key: 'internalCode', sortable: true },
      { title: 'Categoría', key: 'categoryName', sortable: true },
      { title: 'Stock', key: 'currentStock', sortable: true },
      {
        title: 'Precio USD',
        key: 'dollarPrice',
        sortable: true,
        align: 'end',
      },
      {
        title: 'Precio BS',
        key: 'retailPrice',
        sortable: true,
        align: 'end',
      },
      { title: 'Estado', key: 'status', sortable: true },
      { title: 'Acciones', key: 'actions', sortable: false, align: 'center' },
    ]

    const products = computed(() => productStore.products.map(p => ({
      ...p,
      categoryName: p.category?.name || 'Sin Categoría',
    })))
    const categories = computed(() => categoryStore.categories)

    const summaryCards = computed(() => {
      const allProducts = products.value || []
      const totalProducts = allProducts.length
      const activeProducts = allProducts.filter(p => p.status === 'activo').length
      const lowStockProducts = allProducts.filter(p => p.currentStock > 0 && p.currentStock <= 5).length
      const inventoryValue = allProducts.reduce((sum, p) => sum + (p.costPrice * p.currentStock), 0)

      return [
        { title: 'Total Productos', value: totalProducts, icon: 'mdi-package-variant-closed', color: 'blue-grey' },
        { title: 'Productos Activos', value: activeProducts, icon: 'mdi-check-circle-outline', color: 'light-green' },
        { title: 'Stock Bajo', value: lowStockProducts, icon: 'mdi-alert-outline', color: 'orange' },
        { title: 'Valor Total', value: formatCurrency(inventoryValue), icon: 'mdi-cash-multiple', color: 'deep-purple' }
      ]
    })

    const filteredProducts = computed(() => {
      let filtered = products.value
      const searchTerm = search.value?.toLowerCase() || ''

      if (searchTerm) {
        filtered = filtered.filter(p =>
          p.name.toLowerCase().includes(searchTerm) ||
          (p.internalCode && p.internalCode.toLowerCase().includes(searchTerm)) ||
          (p.barcode && p.barcode.toLowerCase().includes(searchTerm))
        )
      }

      if (selectedCategory.value) {
        filtered = filtered.filter(p => p.categoryId === selectedCategory.value)
      }

      if (selectedStatus.value) {
        filtered = filtered.filter(p => p.status === selectedStatus.value)
      }

      if (stockFilter.value) {
        filtered = filtered.filter(p => p.currentStock > 0 && p.currentStock <= 5)
      }

      return filtered
    })

    const paginatedProducts = computed(() => {
      const start = (currentPage.value - 1) * itemsPerPage
      const end = start + itemsPerPage
      return filteredProducts.value.slice(start, end)
    })

    const totalPages = computed(() => Math.ceil(filteredProducts.value.length / itemsPerPage))

    const loadProducts = async () => {
      loading.value = true
      try {
        await productStore.fetchProducts()
        await categoryStore.fetchCategories()
      } catch (error) {
        console.error('Error cargando productos:', error)
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
      loadProducts()
    }

    const confirmDelete = (product) => {
      productToDelete.value = product
      deleteDialog.value = true
    }

    const deleteProduct = async () => {
      try {
        await productStore.deleteProduct(productToDelete.value.id)
        deleteDialog.value = false
        productToDelete.value = null
        loadProducts()
      } catch (error) {
        console.error('Error eliminando producto:', error)
      }
    }

    const generateBarcode = (product) => {
      selectedProduct.value = product
      barcodeDialog.value = true

      setTimeout(() => {
        if (window.JsBarcode) {
          window.JsBarcode("#barcode-container", product.barcode, {
            format: "CODE128",
            width: 2,
            height: 100,
            displayValue: true
          })
        }
      }, 100)
    }

    const printBarcode = () => {
      const printContent = document.getElementById('barcode-container').innerHTML
      const printWindow = window.open('', '_blank')
      printWindow.document.write(`
        <html>
          <head><title>Código de Barras</title></head>
          <body style="text-align: center; padding: 20px;">
            ${printContent}
            <p>${selectedProduct.value.name}</p>
            <p>Precio: ${formatCurrency(selectedProduct.value.retailPrice)}</p>
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.print()
    }

    const getStockColor = (product) => {
      if (product.currentStock === 0) return 'error'
      if (product.currentStock <= 5) return 'warning'
      return 'success'
    }

    const getStatusColor = (status) => {
      switch (status) {
        case 'activo': return 'success'
        case 'descontinuado': return 'warning'
        case 'agotado': return 'error'
        default: return 'grey'
      }
    }

    const getStatusText = (status) => {
      switch (status) {
        case 'activo': return 'Activo'
        case 'descontinuado': return 'Descontinuado'
        case 'agotado': return 'Agotado'
        default: return status
      }
    }

    const fetchCurrentDolarRate = async () => {
      loadingDolarRate.value = true
      try {
        const result = await window.electronAPI.invoke('get-current-dolar-rate')
        if (result.success && result.data) {
          const data = result.data.dataValues || result.data
          currentDolarRate.value = data
        }
      } catch (error) {
        console.error('Error fetching current dolar rate:', error)
      } finally {
        loadingDolarRate.value = false
      }
    }

    const formatBsEquivalent = (usdAmount) => {
      if (!currentDolarRate.value || !currentDolarRate.value.rate || !usdAmount || isNaN(usdAmount)) return ''
      const bsAmount = parseFloat(usdAmount) * parseFloat(currentDolarRate.value.rate)
      return formatCurrency(bsAmount)
    }

    onMounted(() => {
      loadProducts()
      fetchCurrentDolarRate()
    })

    watch(filteredProducts, () => {
      currentPage.value = 1
    })

    const showImage = (product) => {
      if (product.image) {
        selectedProductImage.value = product.image
        imageDialog.value = true
      }
    }

    const showProductDetails = (product) => {
      selectedProductForDetails.value = product
      productDetailsDialog.value = true
    }

    return {
      loading,
      search,
      selectedCategory,
      selectedStatus,
      stockFilter,
      viewMode,
      productDialog,
      deleteDialog,
      barcodeDialog,
      imageDialog,
      productDetailsDialog,
      selectedProduct,
      productToDelete,
      selectedProductImage,
      selectedProductForDetails,
      statusOptions,
      headers,
      products,
      categories,
      summaryCards,
      filteredProducts,
      paginatedProducts,
      totalPages,
      currentPage,
      itemsPerPage,
      loadProducts,
      openProductDialog,
      onProductSaved,
      confirmDelete,
      deleteProduct,
      generateBarcode,
      printBarcode,
      getStockColor,
      getStatusColor,
      getStatusText,
      formatCurrency,
      showImage,
      showProductDetails,
      isCajero,
      currentDolarRate,
      loadingDolarRate,
      formatBsEquivalent,
    }
  },
}