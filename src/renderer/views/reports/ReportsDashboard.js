import { ref, onMounted, computed } from 'vue'
import { useReportsStore } from '@/stores/reports'
import { formatCurrency } from '@/utils/formatters'

export default {
  setup() {
    const reportsStore = useReportsStore()
    const loading = ref(false)
    const tab = ref('sales')

    // Date filters
    const today = new Date()
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    const startDate = ref(firstDayOfMonth.toISOString().substr(0, 10))
    const endDate = ref(today.toISOString().substr(0, 10))

    // Data from store
    const salesReport = ref({})
    const topProducts = ref([])

    // Computed Properties
    const salesSummaryCards = computed(() => {
      const summary = salesReport.value?.summary || {}
      return [
        { title: 'Ventas Totales', value: formatCurrency(summary.totalSales), icon: 'mdi-currency-usd', color: 'success' },
        { title: 'Total Facturas', value: summary.totalInvoices || 0, icon: 'mdi-file-document-outline', color: 'primary' },
        { title: 'Ticket Promedio', value: formatCurrency(summary.averageTicket), icon: 'mdi-receipt-text-outline', color: 'info' }
      ]
    })

    const topProductsHeaders = [
      { title: 'Producto', key: 'name' },
      { title: 'Cantidad Vendida', key: 'quantitySold', align: 'center' },
      { title: 'Ingresos', key: 'revenue', align: 'end' }
    ]

    // Methods
    const loadReports = async () => {
      loading.value = true
      try {
        const dateRange = { startDate: startDate.value, endDate: endDate.value }
        // Fetch sales summary
        const summaryData = await reportsStore.fetchSalesReport(dateRange)
        salesReport.value = summaryData

        // Fetch top selling products
        const topProductsData = await reportsStore.fetchProductReport({ ...dateRange, limit: 10 })
        topProducts.value = topProductsData.map(p => ({
          name: p.productName,
          quantitySold: p.totalSold,
          revenue: formatCurrency(p.totalRevenue)
        }))

      } catch (error) {
        console.error('Error loading reports:', error)
      } finally {
        loading.value = false
      }
    }

    // Lifecycle
    onMounted(loadReports)

    return {
      loading,
      tab,
      startDate,
      endDate,
      salesSummaryCards,
      topProductsHeaders,
      topProducts,
      loadReports,
      formatCurrency
    }
  }
}
