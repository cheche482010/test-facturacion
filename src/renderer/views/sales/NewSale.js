import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useProductStore } from '../../stores/products'
import { useSalesStore } from '../../stores/sales'
import { useAppStore } from '../../stores/app'
import { useCurrencyStore } from '../../stores/currencyStore'
import { formatCurrency } from '@/utils/formatters'

// Get current dolar rate from main process
const getCurrentDolarRate = async () => {
  try {
    const result = await window.electronAPI.invoke('get-current-dolar-rate')
    if (result.success && result.data) {
      return result.data.dataValues.rate
    }
  } catch (error) {
    console.error('Error fetching current dolar rate:', error)
  }
  return null
}

export default {
  setup() {
    const router = useRouter()
    const productStore = useProductStore()
    const saleStore = useSalesStore()
    const appStore = useAppStore()
    const currencyStore = useCurrencyStore()

    // State
    const cartItems = ref([])
    const processingSale = ref(false)
    const isFastSale = ref(false)
    const productSearch = ref('')
    const selectedProduct = ref(null)
    const searchLoading = ref(false)
    const filteredProducts = ref([])
    const notes = ref('')
    const payments = ref([])
    const showPaymentDialog = ref(false)
    const currentDolarRate = ref(36.50)
    const cartHeaders = [
      { title: 'Producto', key: 'name', width: '40%', sortable: false },
      { title: 'Cantidad', key: 'quantity', sortable: false, width: '150px' },
      { title: 'Precio Unit.', key: 'price', align: 'end' },
      { title: 'Subtotal', key: 'subtotal', align: 'end' },
      { title: 'Acciones', key: 'actions', sortable: false, align: 'center', width: '50px' },
    ]

    // Computed Properties
    const products = computed(() => productStore.products)
    const exchangeRate = computed(() => currencyStore.exchangeRate)

    const totals = computed(() => {
      const subtotalUsd = cartItems.value.reduce((acc, item) => acc + (item.quantity * item.price), 0)
      const subtotalBs = subtotalUsd * currentDolarRate.value
      const totalUsd = subtotalUsd
      const totalBs = subtotalBs
      return { subtotalUsd, subtotalBs, totalUsd, totalBs }
    })

    // Methods
    const updateItemSubtotal = (item) => {
      item.subtotal = item.quantity * item.price
    }

    const addProduct = (product) => {
      if (!product) return

      const existingItem = cartItems.value.find(item => item.id === product.id)
      if (existingItem) {
        if (existingItem.quantity < existingItem.stock) {
          existingItem.quantity++
          updateItemSubtotal(existingItem)
        } else {
          console.warn(`Stock limit reached for ${product.name}`)
        }
      } else {
        if (product.retailPrice == null || product.currentStock <= 0) {
          console.warn(`${product.name} is out of stock or has no price.`)
          return
        }
        cartItems.value.unshift({
          id: product.id,
          name: product.name,
          internalCode: product.internalCode,
          price: product.retailPrice,
          quantity: 1,
          stock: product.currentStock,
          subtotal: product.retailPrice,
          image: product.image,
        })
      }
    }

    const addProductFromAutocomplete = (product) => {
      if (product) {
        addProduct(product)
        selectedProduct.value = null
        
        setTimeout(() => {
          productSearch.value = ''
          filteredProducts.value = []
          const autocomplete = document.querySelector('.v-autocomplete input')
          if (autocomplete) {
            autocomplete.blur()
          }
        }, 100)
      }
    }

    const onSearchInput = async (search) => {
      productSearch.value = search

      searchLoading.value = true
      try {
        if (!search || search.trim() === '') {
          filteredProducts.value = products.value.slice(0, 20) 
        } else if (search.length < 2) {
          filteredProducts.value = []
        } else {
          const searchTerm = search.toLowerCase()
          filteredProducts.value = products.value.filter(p =>
            p.barcode === searchTerm ||
            p.internalCode?.toLowerCase() === searchTerm ||
            p.name.toLowerCase().includes(searchTerm)
          ).slice(0, 10) 
        }
      } catch (error) {
        console.error('Error searching products:', error)
        filteredProducts.value = []
      } finally {
        searchLoading.value = false
      }
    }

    const updateQuantity = (item) => {
      if (!item.quantity || item.quantity <= 0) {
        removeItem(item)
        return
      }
      if (item.quantity > item.stock) {
        item.quantity = item.stock
      }
      updateItemSubtotal(item)
    }

    const increaseQuantity = (item) => {
      if (item.quantity < item.stock) {
        item.quantity++
        updateItemSubtotal(item)
      }
    }

    const decreaseQuantity = (item) => {
      if (item.quantity > 1) {
        item.quantity--
        updateItemSubtotal(item)
      }
    }

    const removeItem = (itemToRemove) => {
      cartItems.value = cartItems.value.filter(item => item.id !== itemToRemove.id)
    }

    const processSale = async () => {
      if (cartItems.value.length === 0) return
      if (payments.value.length === 0) {
        console.error('Debe configurar al menos un método de pago')
        return
      }

      processingSale.value = true
      try {
        const saleData = {
          items: cartItems.value.map(item => ({
            productId: item.id,
            quantity: item.quantity,
          })),
          payments: payments.value,
          exchangeRate: currentDolarRate.value,
          notes: notes.value,
        }

        await saleStore.createSale(saleData)
        resetSale()
        router.push('/sales')
        console.log('Sale processed successfully!')
      } catch (error) {
        console.error('Error processing sale:', error)
      } finally {
        processingSale.value = false
      }
    }

    const resetSale = () => {
      cartItems.value = []
      productSearch.value = ''
      selectedProduct.value = null
      filteredProducts.value = []
      payments.value = []
      notes.value = ''
    }

    const openPaymentDialog = () => {
      showPaymentDialog.value = true
    }

    const onPaymentCompleted = (result) => {
      console.log('Payment completed:', result)
      resetSale()
      router.push('/sales')
    }

    const cancelSale = () => {
      resetSale()
    }

    // Lifecycle
    onMounted(async () => {
      await Promise.all([
        productStore.fetchProducts(),
        currencyStore.fetchExchangeRate()
      ])

      // Fetch current dolar rate
      const rate = await getCurrentDolarRate()
      currentDolarRate.value = rate
    })

    // Watchers

    return {
      cartItems,
      processingSale,
      isFastSale,
      productSearch,
      selectedProduct,
      searchLoading,
      filteredProducts,
      notes,
      payments,
      showPaymentDialog,
      cartHeaders,
      products,
      totals,
      appStore,
      addProductFromAutocomplete,
      onSearchInput,
      updateQuantity,
      increaseQuantity,
      decreaseQuantity,
      removeItem,
      processSale,
      cancelSale,
      openPaymentDialog,
      onPaymentCompleted,
      formatCurrency,
      exchangeRate,
      currentDolarRate
    }
  }
}
