import { ref, computed, onMounted } from 'vue'
import { useProductStore } from '../../stores/products'
import { useCustomerStore } from '../../stores/customers'
import { useSaleStore } from '../../stores/sales'
import { useAppStore } from '../../stores/app'
import BarcodeScanner from '../../components/sales/BarcodeScanner/BarcodeScanner.vue'

export default {
  components: {
    BarcodeScanner
  },
  setup() {
    const productStore = useProductStore()
    const customerStore = useCustomerStore()
    const saleStore = useSaleStore()
    const appStore = useAppStore()

    const cartItems = ref([])
    const selectedCustomerId = ref(1)
    const processingSale = ref(false)

    const cartHeaders = [
      { title: 'Producto', key: 'name' },
      { title: 'Cantidad', key: 'quantity', sortable: false },
      { title: 'Precio Unit.', key: 'price', align: 'end' },
      { title: 'Subtotal', key: 'subtotal', align: 'end' },
      { title: 'Acciones', key: 'actions', sortable: false, align: 'center' }
    ]

    const products = computed(() => productStore.products)
    const customers = computed(() => customerStore.customers)

    const totals = computed(() => {
      const subtotal = cartItems.value.reduce((acc, item) => acc + (item.quantity * item.price), 0)
      const tax = subtotal * 0.16
      const total = subtotal + tax
      return { subtotal, tax, total }
    })

    const updateItemSubtotal = (item) => {
      item.subtotal = item.quantity * item.price
    }

    const addProductByBarcode = (barcode) => {
      const product = products.value.find(p => p.barcode === barcode)
      if (product) {
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
      } else {
        console.warn(`Product with barcode ${barcode} not found.`)
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

      processingSale.value = true
      try {
        const saleData = {
          customerId: selectedCustomerId.value,
          items: cartItems.value.map(item => ({
            productId: item.id,
            quantity: item.quantity,
            unitPrice: item.price
          }))
        }

        await saleStore.createSale(saleData)
        resetSale()
        console.log('Sale processed successfully!')
      } catch (error) {
        console.error('Error processing sale:', error)
      } finally {
        processingSale.value = false
      }
    }

    const resetSale = () => {
      cartItems.value = []
      selectedCustomerId.value = 1
    }

    const formatCurrency = (amount) => {
      const value = typeof amount === 'number' ? amount : 0
      return new Intl.NumberFormat('es-VE', {
        style: 'currency',
        currency: 'VES'
      }).format(value)
    }

    onMounted(async () => {
      await Promise.all([
        productStore.fetchProducts(),
        customerStore.fetchCustomers()
      ])
    })

    return {
      cartItems,
      selectedCustomerId,
      processingSale,
      cartHeaders,
      products,
      customers,
      totals,
      appStore,
      addProductByBarcode,
      updateQuantity,
      removeItem,
      processSale,
      formatCurrency
    }
  }
}