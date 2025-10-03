import { ref, computed, watch } from 'vue'
import Calculator from '../Calculator/Calculator.vue'
import { useSalesStore } from '../../../stores/sales'
import { useAppStore } from '../../../stores/app'

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

    const valid = ref(false)
    const processing = ref(false)
    const showCalculator = ref(false)
    const form = ref(null)

    const paymentMethods = [
      { title: 'Efectivo (Bs)', value: 'efectivo_bs' },
      { title: 'Efectivo (USD)', value: 'efectivo_usd' },
      { title: 'Transferencia', value: 'transferencia' },
      { title: 'POS', value: 'pos' },
      { title: 'Pago Móvil', value: 'pago_movil' },
      { title: 'Crédito', value: 'credito' }
    ]

    const documentTypes = [
      { title: 'Factura', value: 'factura' },
      { title: 'Ticket', value: 'ticket' },
      { title: 'Nota de Débito', value: 'nota_debito' }
    ]

    const banks = [
      'Banesco', 'Mercantil', 'Venezuela', 'Provincial', 'Bicentenario',
      'Tesoro', 'BOD', 'Bancaribe', 'Exterior', 'Activo'
    ]

    const rules = {
      required: value => !!value || 'Este campo es requerido',
      positive: value => value > 0 || 'Debe ser mayor a 0'
    }

    const paymentData = ref({
      method: 'efectivo_bs',
      receivedAmount: 0,
      paidAmount: 0,
      referenceNumber: '',
      bank: '',
      phoneNumber: '',
      lastFourDigits: '',
      dueDate: '',
      documentType: 'ticket',
      notes: ''
    })

    const dialog = computed({
      get: () => props.modelValue,
      set: (value) => emit('update:modelValue', value)
    })

    const exchangeRate = computed(() => appStore.settings.exchangeRate || 1)

    const totalInPaymentCurrency = computed(() => {
      if (paymentData.value.method === 'efectivo_usd') {
        return props.saleData.total / exchangeRate.value
      }
      return props.saleData.total
    })

    const changeAmount = computed(() => {
      if (!paymentData.value.receivedAmount) return 0
      return paymentData.value.receivedAmount - totalInPaymentCurrency.value
    })

    const onPaymentMethodChange = () => {
      paymentData.value.receivedAmount = 0
      paymentData.value.referenceNumber = ''
      paymentData.value.bank = ''
      paymentData.value.phoneNumber = ''
      paymentData.value.lastFourDigits = ''
      
      showCalculator.value = paymentData.value.method.includes('efectivo')
      
      if (paymentData.value.method.includes('efectivo')) {
        paymentData.value.receivedAmount = totalInPaymentCurrency.value
      }
    }

    const calculateChange = () => {
      // El cambio se calcula automáticamente en el computed
    }

    const onCalculatorResult = (result) => {
      paymentData.value.receivedAmount = result
    }

    const processSale = async () => {
      if (!form.value.validate()) return

      processing.value = true
      try {
        const salePayload = {
          ...props.saleData,
          payment: {
            ...paymentData.value,
            changeAmount: changeAmount.value,
            totalInPaymentCurrency: totalInPaymentCurrency.value
          }
        }

        const result = await salesStore.createSale(salePayload)
        emit('payment-completed', result)
      } catch (error) {
        console.error('Error procesando venta:', error)
      } finally {
        processing.value = false
      }
    }

    const closeDialog = () => {
      dialog.value = false
    }

    const formatCurrency = (amount) => {
      return new Intl.NumberFormat('es-VE', {
        style: 'currency',
        currency: 'VES'
      }).format(amount)
    }

    watch(() => props.saleData?.total, (newTotal) => {
      if (newTotal && paymentData.value.method.includes('efectivo')) {
        paymentData.value.receivedAmount = totalInPaymentCurrency.value
      }
    })

    watch(dialog, (isOpen) => {
      if (isOpen) {
        paymentData.value = {
          method: 'efectivo_bs',
          receivedAmount: totalInPaymentCurrency.value,
          paidAmount: 0,
          referenceNumber: '',
          bank: '',
          phoneNumber: '',
          lastFourDigits: '',
          dueDate: '',
          documentType: 'ticket',
          notes: ''
        }
        showCalculator.value = true
      }
    })

    return {
      valid,
      processing,
      showCalculator,
      form,
      paymentMethods,
      documentTypes,
      banks,
      rules,
      paymentData,
      dialog,
      exchangeRate,
      totalInPaymentCurrency,
      changeAmount,
      onPaymentMethodChange,
      calculateChange,
      onCalculatorResult,
      processSale,
      closeDialog,
      formatCurrency
    }
  }
}