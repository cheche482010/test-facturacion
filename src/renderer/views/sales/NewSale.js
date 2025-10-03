import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useProductStore } from '../../stores/products'
import { useCustomerStore } from '../../stores/customers'
import { useSaleStore } from '../../stores/sales'
import { useAppStore } from '../../stores/app'
import { formatCurrency } from '@/utils/formatters'

export default {
  setup() {
    const router = useRouter()
    const productStore = useProductStore()
    const customerStore = useCustomerStore()
    const saleStore = useSaleStore()
    const appStore = useAppStore()

    // State
    const cartItems = ref([])
    const selectedCustomerId = ref(null)
    const processingSale = ref(false)
    const isFastSale = ref(false)
    const productSearch = ref('')
    const globalDiscount = ref(0)
    const paymentMethod = ref('Efectivo (Bs)')
    const notes = ref('')
    const taxRate = ref(0.16) // Default 16%

    // Options
    const paymentMethods = ['Efectivo (Bs)', 'Efectivo ($)', 'Transferencia', 'Tarjeta de Débito', 'Tarjeta de Crédito', 'Crédito']
    const cartHeaders = [
      { title: 'Producto', key: 'name' },
      { title: 'Cantidad', key: 'quantity', sortable: false, width: '150px' },
      { title: 'Precio Unit.', key: 'price', align: 'end' },
      { title: 'Subtotal', key: 'subtotal', align: 'end' },
      { title: 'Acciones', key: 'actions', sortable: false, align: 'center', width: '50px' }
    ]

    // Computed Properties
    const products = computed(() => productStore.products)
    const customers = computed(() => customerStore.customers)
    const selectedCustomer = computed(() => {
      return customers.value.find(c => c.id === selectedCustomerId.value)
    })

    const totals = computed(() => {
      const subtotal = cartItems.value.reduce((acc, item) => acc + (item.quantity * item.price), 0)
      const discount = globalDiscount.value > subtotal ? subtotal : globalDiscount.value
      const subtotalAfterDiscount = subtotal - discount
      const tax = subtotalAfterDiscount * taxRate.value
      const total = subtotalAfterDiscount + tax
      return { subtotal, discount, tax, total }
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
          subtotal: product.retailPrice
        })
      }
    }

    const addProductFromSearch = () => {
      if (!productSearch.value) return
      const searchTerm = productSearch.value.toLowerCase()
      const product = products.value.find(p =>
        p.barcode === searchTerm ||
        p.internalCode?.toLowerCase() === searchTerm ||
        p.name.toLowerCase().includes(searchTerm)
      )
      if (product) {
        addProduct(product)
        productSearch.value = ''
      } else {
        console.warn(`Product with search term "${searchTerm}" not found.`)
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

    const removeItem = (itemToRemove) => {
      cartItems.value = cartItems.value.filter(item => item.id !== itemToRemove.id)
    }

    const processSale = async () => {
      if (cartItems.value.length === 0) return
      if (!isFastSale.value && !selectedCustomerId.value) {
          // TODO: show error to user
          console.error('Please select a customer for a standard sale.')
          return
      }

      processingSale.value = true
      try {
        const saleData = {
          customerId: isFastSale.value ? null : selectedCustomerId.value,
          items: cartItems.value.map(item => ({
            productId: item.id,
            quantity: item.quantity,
            unitPrice: item.price,
            subtotal: item.subtotal
          })),
          subtotal: totals.value.subtotal,
          discount: totals.value.discount,
          tax: totals.value.tax,
          total: totals.value.total,
          paymentMethod: paymentMethod.value,
          notes: notes.value,
          status: paymentMethod.value === 'Crédito' ? 'pending' : 'paid'
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
      selectedCustomerId.value = null
      productSearch.value = ''
      globalDiscount.value = 0
      paymentMethod.value = 'Efectivo (Bs)'
      notes.value = ''
    }

    const cancelSale = () => {
      resetSale()
      router.push('/dashboard')
    }

    // Lifecycle
    onMounted(async () => {
      await Promise.all([
        productStore.fetchProducts(),
        customerStore.fetchCustomers()
      ])
      // Set default customer if in fast sale mode
      if (appStore.settings.defaultCustomerForFastSale) {
          selectedCustomerId.value = appStore.settings.defaultCustomerForFastSale
      }
    })

    // Watchers
    watch(isFastSale, (isFast) => {
        if(isFast && appStore.settings.defaultCustomerForFastSale) {
            selectedCustomerId.value = appStore.settings.defaultCustomerForFastSale
        } else if (!isFast) {
            selectedCustomerId.value = null
        }
    })

    return {
      cartItems,
      selectedCustomerId,
      selectedCustomer,
      processingSale,
      isFastSale,
      productSearch,
      globalDiscount,
      paymentMethod,
      notes,
      taxRate,
      paymentMethods,
      cartHeaders,
      products,
      customers,
      totals,
      appStore,
      addProductFromSearch,
      updateQuantity,
      removeItem,
      processSale,
      cancelSale,
      formatCurrency
    }
  }
}