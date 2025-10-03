import { ref, onMounted, computed } from 'vue'
import { useReportsStore } from '@/stores/reports'
import { storeToRefs } from 'pinia'

export default {
  name: 'ReportsDashboard',
  setup() {
    const reportsStore = useReportsStore()
    const { dashboardData, productReports } = storeToRefs(reportsStore)

    const startDate = ref(new Date().toISOString().substr(0, 10))
    const endDate = ref(new Date().toISOString().substr(0, 10))
    const startDateMenu = ref(false)
    const endDateMenu = ref(false)

    const totalSales = computed(() => dashboardData.value.summary?.totalSales || 0)
    const totalInvoices = computed(() => dashboardData.value.summary?.pendingInvoices || 0)
    const totalCustomers = computed(() => dashboardData.value.summary?.totalCustomers || 0)
    const lowStockProducts = computed(() => dashboardData.value.quickSummary?.lowStockCount || 0)
    const topProducts = computed(() => {
      return (productReports.value || []).map(p => ({
        name: p.productName,
        quantity: p.totalSold,
        total: p.totalRevenue
      }))
    })

    const topProductsHeaders = [
      { title: 'Producto', key: 'name' },
      { title: 'Cantidad Vendida', key: 'quantity' },
      { title: 'Total', key: 'total' }
    ]

    const loadReports = async () => {
      try {
        await reportsStore.fetchDashboardData()
        await reportsStore.fetchProductReport({
          startDate: startDate.value,
          endDate: endDate.value,
          limit: 5
        })
      } catch (error) {
        console.error('Error loading reports:', error)
      }
    }

    const exportSalesReport = async () => {
      console.log('Exporting sales report...')
    }

    const exportInventoryReport = async () => {
      console.log('Exporting inventory report...')
    }

    const exportCustomerReport = async () => {
      console.log('Exporting customer report...')
    }

    onMounted(() => {
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      startDate.value = thirtyDaysAgo.toISOString().substr(0, 10)

      loadReports()
    })

    return {
      startDate,
      endDate,
      startDateMenu,
      endDateMenu,
      totalSales,
      totalInvoices,
      totalCustomers,
      lowStockProducts,
      topProducts,
      topProductsHeaders,
      loadReports,
      exportSalesReport,
      exportInventoryReport,
      exportCustomerReport
    }
  }
}