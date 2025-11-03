import { ref, onMounted, computed } from 'vue'
import { useReportsStore } from '@/stores/reports'
import { useAuthStore } from '@/stores/auth'
import { useSettingsStore } from '@/stores/settingsStore'
import { formatCurrency, formatDate } from '@/utils/formatters'

export default {
  setup() {
    const reportsStore = useReportsStore()
    const authStore = useAuthStore()
    const settingsStore = useSettingsStore()
    const loading = ref(true)
    const dashboardData = ref({})
    const currentDolarRate = ref(null)
    const loadingDolarRate = ref(false)

    const formattedDate = computed(() => {
      return new Date().toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    })

    const summaryCards = computed(() => [
      { title: 'Total Productos', value: dashboardData.value.summary?.totalProducts || 0, icon: 'mdi-package-variant-closed', color: 'blue-grey' },
      { title: 'Ventas Totales', value: formatCurrency(dashboardData.value.summary?.totalSales), icon: 'mdi-cash-multiple', color: 'deep-purple' },
      { title: 'Ventas Hoy', value: formatCurrency(dashboardData.value.summary?.todaySales), icon: 'mdi-cash-register', color: 'orange' },
    ])

    const salesChartData = computed(() => {
      const labels = dashboardData.value.salesLast7Days?.map(d => new Date(d.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })) || []
      const values = dashboardData.value.salesLast7Days?.map(d => d.total) || []
      return { labels, values }
    })

    const recentSalesHeaders = [
      { title: 'Factura', key: 'saleNumber' },
      { title: 'Fecha', key: 'saleDate' },
      { title: 'Pago', key: 'paymentMethod' },
      { title: 'Estado', key: 'status' },
      { title: 'Total', key: 'total', align: 'end' },
    ]

    const getStatusColor = (status) => {
      const colors = { paid: 'success', pending: 'warning', cancelled: 'error' }
      return colors[status] || 'grey'
    }

    const getStatusText = (status) => {
      const texts = { paid: 'Pagado', pending: 'Pendiente', cancelled: 'Cancelado' }
      return texts[status] || status
    }

    const getPaymentMethodColor = (method) => {
      if (!method) return 'grey'
      const lowerMethod = String(method).toLowerCase()
      if (lowerMethod.includes('efectivo') || lowerMethod.includes('cash')) {
        return 'success'
      }
      if (lowerMethod.includes('crédito') || lowerMethod.includes('credit')) {
        return 'warning'
      }
      return 'grey'
    }

    const fetchCurrentDolarRate = async () => {
      loadingDolarRate.value = true
      try {
        const result = await window.electronAPI.invoke('get-current-dolar-rate')
        if (result.success && result.data) {
          currentDolarRate.value = result.data
        }
      } catch (error) {
        console.error('Error fetching current dolar rate:', error)
      } finally {
        loadingDolarRate.value = false
      }
    }

    onMounted(async () => {
      try {
        loading.value = true
        const data = await reportsStore.fetchDashboardData()
        dashboardData.value = data
        await fetchCurrentDolarRate()
      } catch (error) {
        console.error('Error loading dashboard:', error)
      } finally {
        loading.value = false
      }
    })

    return {
      loading,
      dashboardData,
      formattedDate,
      summaryCards,
      salesChartData,
      recentSalesHeaders,
      getStatusColor,
      getStatusText,
      getPaymentMethodColor,
      formatCurrency,
      formatDate,
      authStore,
      settingsStore,
      currentDolarRate,
      loadingDolarRate
    }
  }
}