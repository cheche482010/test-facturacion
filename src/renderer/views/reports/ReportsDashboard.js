import { ref, onMounted, computed } from 'vue'
import { useReportsStore } from '@/stores/reports'
import { useCurrencyStore } from '@/stores/currencyStore'
import { formatCurrency } from '@/utils/formatters'

export default {
  setup() {
    const reportsStore = useReportsStore()
    const currencyStore = useCurrencyStore()
    const tab = ref('sales')

    // Date filters for components that need them
    const today = new Date()
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    const startDate = ref(firstDayOfMonth.toISOString().substr(0, 10))
    const endDate = ref(today.toISOString().substr(0, 10))

    // Computed property for current dollar rate from currency store
    const currentDolarRate = computed(() => currencyStore.exchangeRate)

    // Load current dollar rate on mount
    const loadCurrentDolarRate = async () => {
      try {
        await currencyStore.fetchExchangeRate()
      } catch (error) {
        console.error('Error loading current dollar rate:', error)
      }
    }

    // Lifecycle
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
