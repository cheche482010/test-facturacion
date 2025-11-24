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
    saleData: Object,
    notes: {
      type: String,
      default: ''
    }
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

    const exchangeRate = computed(() => currencyStore.exchangeRate)

    const totalPaid = computed(() => {
      return payments.value.reduce((sum, payment) => {
        if (payment.currency === 'USD') {
          return sum + (payment.amount * exchangeRate.value)
        } else {
          return sum + payment.amount
        }
      }, 0)
    })

    const remainingAmount = computed(() => {
      const diff = Math.round((props.saleData.totalBs - totalPaid.value) * 100) / 100;
      return Math.max(0, diff);
    })

    const changeAmount = computed(() => {
      const diff = Math.round((totalPaid.value - props.saleData.totalBs) * 100) / 100;
      return Math.max(0, diff);
    })

    const isCashPayment = computed(() => {
      const selectedMethod = availablePaymentMethods.value.find(m => m.id === paymentData.value.paymentMethodId)
      return selectedMethod && (selectedMethod.name === 'Efectivo BS' || selectedMethod.name === 'Efectivo USD')
    })

    const onPaymentMethodChange = () => {
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

      paymentData.value = {
        paymentMethodId: null,
        amount: 0,
        reference: '',
        notes: ''
      }
      form.value.resetValidation()
    }

    const completeSale = async () => {
      if (remainingAmount.value > 0 && changeAmount.value <= 0) return

      processing.value = true
      try {
        const result = await salesStore.createSale({
          items: props.saleData.items.map(item => ({
            productId: item.id,
            quantity: item.quantity
          })),
          payments: payments.value.map(p => ({
            paymentMethodId: p.paymentMethodId,
            amount: p.currency === 'USD' ? p.amount * exchangeRate.value : p.amount,
            reference: p.reference,
            notes: p.notes
          })),
          exchangeRate: exchangeRate.value,
          notes: props.notes
        })
        emit('payment-completed', result)
      } catch (error) {
        console.error('Error procesando venta:', error)
      } finally {
        processing.value = false
      }
    }

    const editPayment = (index) => {
      const payment = payments.value[index]
      paymentData.value = {
        paymentMethodId: payment.paymentMethodId,
        amount: payment.amount,
        reference: payment.reference || '',
        notes: payment.notes || ''
      }
      removePayment(index)
    }

    const removePayment = (index) => {
      payments.value.splice(index, 1)
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

    const getIconForMethod = (name) => {
      const icons = {
        'Efectivo BS': 'mdi-cash',
        'Efectivo USD': 'mdi-cash-multiple',
        'Transferencia': 'mdi-bank-transfer',
        'POS': 'mdi-credit-card-chip',
        'Pago Móvil': 'mdi-cellphone',
        'Crédito': 'mdi-credit-card'
      }
      return icons[name] || 'mdi-cash'
    }

    const loadPaymentMethods = async () => {
      try {
        // Use fetch API to get payment methods from backend
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/payment-methods`, {
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
      // Add icons to payment methods
      availablePaymentMethods.value = availablePaymentMethods.value.map(method => ({
        ...method,
        icon: getIconForMethod(method.name)
      }))
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
        await currencyStore.fetchExchangeRate()
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
      changeAmount,
      isCashPayment,
      onPaymentMethodChange,
      addPayment,
      editPayment,
      removePayment,
      completeSale,
      closeDialog,
      formatCurrency,
      getIconForMethod
    }
  }
}