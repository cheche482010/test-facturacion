import { ref, computed, onMounted } from 'vue'
import ProductDialog from '../../components/products/ProductDialog/ProductDialog.vue'
import { useProductStore } from '../../stores/products'
import { useCategoryStore } from '../../stores/categories'

export default {
  components: {
    ProductDialog
  },
  setup() {
    const productStore = useProductStore()
    const categoryStore = useCategoryStore()

    const loading = ref(false)
    const search = ref('')
    const selectedCategory = ref(null)
    const selectedStatus = ref(null)
    const stockFilter = ref(null)
    const productDialog = ref(false)
    const deleteDialog = ref(false)
    const barcodeDialog = ref(false)
    const selectedProduct = ref(null)
    const productToDelete = ref(null)

    const statusOptions = [
      { title: 'Activo', value: 'activo' },
      { title: 'Descontinuado', value: 'descontinuado' },
      { title: 'Agotado', value: 'agotado' }
    ]

    const stockFilterOptions = [
      { title: 'Stock bajo', value: 'low' },
      { title: 'Stock normal', value: 'normal' },
      { title: 'Sin stock', value: 'empty' }
    ]

    const headers = [
      { title: '', key: 'image', sortable: false, width: '60px' },
      { title: 'Producto', key: 'name', sortable: true },
      { title: 'Categoría', key: 'category', sortable: false },
      { title: 'Stock', key: 'currentStock', sortable: true },
      { title: 'Precios', key: 'retailPrice', sortable: true },
      { title: 'Estado', key: 'status', sortable: true },
      { title: 'Acciones', key: 'actions', sortable: false, width: '120px' }
    ]

    const products = computed(() => productStore.products)
    const categories = computed(() => categoryStore.categories)

    const filteredProducts = computed(() => {
      let filtered = products.value

      if (selectedCategory.value) {
        filtered = filtered.filter(p => p.categoryId === selectedCategory.value)
      }

      if (selectedStatus.value) {
        filtered = filtered.filter(p => p.status === selectedStatus.value)
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
            filtered = filtered.filter(p => p.currentStock > p.minStock)
            break
        }
      }

      return filtered
    })

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
      if (product.currentStock <= product.minStock) return 'warning'
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

    const formatCurrency = (amount) => {
      return new Intl.NumberFormat('es-VE', {
        style: 'currency',
        currency: 'VES'
      }).format(amount)
    }

    onMounted(() => {
      loadProducts()
    })

    return {
      loading,
      search,
      selectedCategory,
      selectedStatus,
      stockFilter,
      productDialog,
      deleteDialog,
      barcodeDialog,
      selectedProduct,
      productToDelete,
      statusOptions,
      stockFilterOptions,
      headers,
      products,
      categories,
      filteredProducts,
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
      formatCurrency
    }
  }
}