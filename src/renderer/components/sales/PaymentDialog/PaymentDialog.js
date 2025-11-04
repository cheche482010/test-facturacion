import { ref, computed, watch } from 'vue'
import Calculator from '../Calculator/Calculator.vue'
import { useSalesStore } from '../../../stores/sales'
import { useAppStore } from '../../../stores/app'
import { useCurrencyStore } from '../../../stores/currencyStore'

export default {
  components: {
    Calculator
  },
  props: {
    modelValue: Boolean,
    saleData: Object
  },
  emits: ['update:modelValue', 'payment-completed'],
  setup(props, { emit }) {
    const salesStore = useSalesStore()
    const appStore = useAppStore()
    const currencyStore = useCurrencyStore()

    const valid = ref(false)
    const processing = ref(false)
    const showCalculator = ref(false)
    const form = ref(null)
    const payments = ref([])
    const availablePaymentMethods = ref([])

    const rules = {
      required: value => !!value || 'Este campo es requerido',
      positive: value => value > 0 || 'Debe ser mayor a 0'
    }

    const paymentData = ref({
      paymentMethodId: null,
      amount: 0,
      reference: '',
      notes: ''
    })

    const dialog = computed({
      get: () => props.modelValue,
      set: (value) => emit('update:modelValue', value)
    })

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
      return 36.50 // fallback
    }

    const exchangeRate = ref(36.50)

    // Load current exchange rate when dialog opens
    const loadExchangeRate = async () => {
      exchangeRate.value = await getCurrentDolarRate()
    }

    const totalPaid = computed(() => {
      return payments.value.reduce((sum, payment) => sum + payment.amount, 0)
    })

    const remainingAmount = computed(() => {
      return props.saleData.totalBs - totalPaid.value
    })

    const onPaymentMethodChange = () => {
      // Reset amount when method changes
      paymentData.value.amount = 0
    }

    const addPayment = () => {
      if (!form.value.validate()) return

      const selectedMethod = availablePaymentMethods.value.find(m => m.id === paymentData.value.paymentMethodId)
      if (!selectedMethod) return

      payments.value.push({
        paymentMethodId: paymentData.value.paymentMethodId,
        methodName: selectedMethod.name,
        amount: paymentData.value.amount,
        reference: paymentData.value.reference,
        currency: selectedMethod.name.toLowerCase().includes('usd') ? 'USD' : 'VES',
        notes: paymentData.value.notes
      })

      // Reset form
      paymentData.value = {
        paymentMethodId: null,
        amount: 0,
        reference: '',
        notes: ''
      }
      form.value.resetValidation()
    }

    const completeSale = async () => {
      if (remainingAmount.value > 0) return

      processing.value = true
      try {
        const result = await salesStore.createSale({
          items: props.saleData.items.map(item => ({
            productId: item.id,
            quantity: item.quantity
          })),
          payments: payments.value.map(p => ({
            paymentMethodId: p.paymentMethodId,
            amount: p.amount
          })),
          exchangeRate: exchangeRate.value,
          notes: ''
        })
        emit('payment-completed', result)
        dialog.value = false
      } catch (error) {
        console.error('Error procesando venta:', error)
      } finally {
        processing.value = false
      }
    }

    const closeDialog = () => {
      dialog.value = false
      payments.value = []
    }

    const formatCurrency = (amount, currency = 'VES') => {
      return new Intl.NumberFormat('es-VE', {
        style: 'currency',
        currency: currency
      }).format(amount)
    }

    const loadPaymentMethods = async () => {
      try {
        // Use fetch API to get payment methods from backend
        const response = await fetch('http://localhost:3001/api/payment-methods', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        })
        if (response.ok) {
          availablePaymentMethods.value = await response.json()
        } else {
          // Fallback to hardcoded methods if API fails
          availablePaymentMethods.value = [
            { id: 1, name: 'Efectivo BS' },
            { id: 2, name: 'Efectivo USD' },
            { id: 3, name: 'Transferencia' },
            { id: 4, name: 'POS' },
            { id: 5, name: 'Pago Móvil' },
            { id: 6, name: 'Crédito' }
          ]
        }
      } catch (error) {
        console.error('Error loading payment methods:', error)
        // Fallback
        availablePaymentMethods.value = [
          { id: 1, name: 'Efectivo BS' },
          { id: 2, name: 'Efectivo USD' },
          { id: 3, name: 'Transferencia' },
          { id: 4, name: 'POS' },
          { id: 5, name: 'Pago Móvil' },
          { id: 6, name: 'Crédito' }
        ]
      }
    }

    watch(dialog, async (isOpen) => {
      if (isOpen) {
        payments.value = []
        paymentData.value = {
          paymentMethodId: null,
          amount: 0,
          reference: '',
          notes: ''
        }
        await loadExchangeRate()
        await loadPaymentMethods()
      }
    })

    return {
      valid,
      processing,
      showCalculator,
      form,
      availablePaymentMethods,
      rules,
      paymentData,
      payments,
      dialog,
      exchangeRate,
      totalPaid,
      remainingAmount,
      onPaymentMethodChange,
      addPayment,
      completeSale,
      closeDialog,
      formatCurrency
    }
  }
}