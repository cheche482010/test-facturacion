import { ref, onMounted, computed } from 'vue'
import { useReportsStore } from '@/stores/reports'
import { formatCurrency, formatDate } from '@/utils/formatters'

export default {
  setup() {
    const reportsStore = useReportsStore()
    const loading = ref(true)
    const dashboardData = ref({})

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
      { title: 'Total Clientes', value: dashboardData.value.summary?.totalCustomers || 0, icon: 'mdi-account-group', color: 'light-green' },
      { title: 'Ventas Totales', value: formatCurrency(dashboardData.value.summary?.totalSales), icon: 'mdi-cash-multiple', color: 'deep-purple' },
      { title: 'Ventas Hoy', value: formatCurrency(dashboardData.value.summary?.todaySales), icon: 'mdi-cash-register', color: 'orange' },
      { title: 'Valor Inventario', value: formatCurrency(dashboardData.value.summary?.inventoryValue), icon: 'mdi-warehouse', color: 'indigo' },
    ])

    const salesChartData = computed(() => {
      const labels = dashboardData.value.salesLast7Days?.map(d => new Date(d.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })) || []
      const values = dashboardData.value.salesLast7Days?.map(d => d.total) || []
      return { labels, values }
    })

    const recentSalesHeaders = [
      { title: 'Factura', key: 'invoiceNumber' },
      { title: 'Cliente', key: 'Customer.name' },
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
      const lowerMethod = method.toLowerCase()
      if (lowerMethod.includes('efectivo')) {
        return 'success'
      }
      if (lowerMethod.includes('credito')) {
        return 'warning'
      }
      return 'grey'
    }

    onMounted(async () => {
      try {
        loading.value = true
        const data = await reportsStore.fetchDashboardData()
        dashboardData.value = data
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
      formatDate
    }
  }
}