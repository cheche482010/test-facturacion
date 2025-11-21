import { ref, onMounted, computed } from 'vue'
import { useReportsStore } from '@/stores/reports'
import { useCurrencyStore } from '@/stores/currencyStore'
import { formatCurrency } from '@/utils/formatters'

export default {
  setup() {
    const reportsStore = useReportsStore()
    const currencyStore = useCurrencyStore()
    const tab = ref('sales')

    const today = new Date()
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    const startDate = ref(firstDayOfMonth.toISOString().substr(0, 10))
    const endDate = ref(today.toISOString().substr(0, 10))

    const currentDolarRate = computed(() => currencyStore.exchangeRate)

    const loadCurrentDolarRate = async () => {
      try {
        await currencyStore.fetchExchangeRate()
      } catch (error) {
        console.error('Error loading current dollar rate:', error)
      }
    }

    onMounted(() => {
      loadCurrentDolarRate()
    })

    return {
      tab,
      startDate,
      endDate,
      currentDolarRate,
      formatCurrency
    }
  }
}
