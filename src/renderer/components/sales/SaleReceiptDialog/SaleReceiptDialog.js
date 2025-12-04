import { useSettingsStore } from '../../../stores/settingsStore'

export default {
  name: 'SaleReceiptDialog',
  props: {
    modelValue: Boolean,
    sale: Object,
    exchangeRate: {
      type: Number,
      default: 1
    }
  },
  emits: ['update:modelValue', 'sale-completed'],
  setup() {
    const settingsStore = useSettingsStore()
    return { settingsStore }
  },
  data() {
    return {
      completing: false
    }
  },
  computed: {
    company() {
      return {
        name: this.settingsStore.settings.company_name,
        rif: this.settingsStore.settings.company_rif,
        address: this.settingsStore.settings.company_address,
        phone: this.settingsStore.settings.company_phone,
        email: this.settingsStore.settings.company_email
      }
    },
    dialog: {
      get() {
        return this.modelValue
      },
      set(value) {
        this.$emit('update:modelValue', value)
      }
    },
    totalQuantity() {
      if (!this.sale?.items) return 0
      return this.sale.items.reduce((sum, item) => sum + Math.floor(item.quantity), 0)
    },
    totalPaid() {
      if (!this.sale?.payments) return 0
      return this.sale.payments.reduce((sum, payment) => sum + parseFloat(payment.amount), 0)
    },
    changeAmount() {
      return parseFloat(this.sale?.changeGivenBs || 0)
    },
    changeCurrency() {
      return this.changeAmount > 0 ? 'VES' : null
    }
  },
  methods: {
    formatDate(date) {
      return new Date(date).toLocaleDateString('es-VE', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    },
    formatCurrency(amount, currency = 'VES') {
      return new Intl.NumberFormat('es-VE', {
        style: 'currency',
        currency: currency
      }).format(amount)
    },
    getIconForMethod(name) {
      const icons = {
        'Efectivo BS': 'mdi-cash',
        'Efectivo USD': 'mdi-cash-multiple',
        'Transferencia': 'mdi-bank-transfer',
        'POS': 'mdi-credit-card-chip',
        'Pago Móvil': 'mdi-cellphone',
        'Crédito': 'mdi-credit-card'
      }
      return icons[name] || 'mdi-cash'
    },
    printReceipt() {
      window.print()
    },
    async completeSale() {
      this.completing = true
      try {
        this.$emit('sale-completed')
        this.dialog = false
      } catch (error) {
        console.error('Error completando venta:', error)
      } finally {
        this.completing = false
      }
    }
  }
}