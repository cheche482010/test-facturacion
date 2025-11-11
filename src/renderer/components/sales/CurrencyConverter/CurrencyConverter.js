import { ref, onMounted, watch } from 'vue'
import VueCountryFlag from 'vue-country-flag-next'

export default {
  components: {
    VueCountryFlag
  },
  setup() {
    const amount = ref(0)
    const fromCurrency = ref('VES')
    const toCurrency = ref('USD')
    const convertedAmount = ref(null)
    const exchangeRate = ref(36.50)

    const currencies = [
      { code: 'VES', name: 'Bolívares (Bs)', countryCode: 'VE' },
      { code: 'USD', name: 'Dólares (USD)', countryCode: 'US' }
    ]

    const fetchExchangeRate = async () => {
      try {
        const result = await window.electronAPI.invoke('get-current-dolar-rate')
        if (result.success && result.data) {
          exchangeRate.value = result.data.dataValues.rate
        }
      } catch (error) {
        console.error('Error fetching exchange rate:', error)
      }
    }

    const convert = () => {
      if (!amount.value || !exchangeRate.value) {
        convertedAmount.value = null
        return
      }

      if (fromCurrency.value === 'VES' && toCurrency.value === 'USD') {
        convertedAmount.value = amount.value / exchangeRate.value
      } else if (fromCurrency.value === 'USD' && toCurrency.value === 'VES') {
        convertedAmount.value = amount.value * exchangeRate.value
      } else {
        convertedAmount.value = amount.value
      }
    }

    const swapCurrencies = () => {
      const temp = fromCurrency.value
      fromCurrency.value = toCurrency.value
      toCurrency.value = temp
      convert()
    }

    const formatCurrency = (amount, currency = 'VES') => {
      return new Intl.NumberFormat('es-VE', {
        style: 'currency',
        currency: currency
      }).format(amount)
    }

    onMounted(() => {
      fetchExchangeRate()
    })

    watch([amount, fromCurrency, toCurrency, exchangeRate], () => {
      convert()
    })

    return {
      amount,
      fromCurrency,
      toCurrency,
      convertedAmount,
      exchangeRate,
      currencies,
      convert,
      formatCurrency,
      swapCurrencies
    }
  }
}