import { useReportsStore } from '@/stores/reports'
import Chart from 'chart.js/auto'

export default {
  name: 'ReportsDashboard',
  data() {
    return {
      loading: false,
      salesChart: null
    }
  },
  setup() {
    const reportsStore = useReportsStore()
    return { reportsStore }
  },
  computed: {
    dashboardData() {
      return this.reportsStore.dashboardData
    }
  },
  async mounted() {
    await this.loadDashboardData()
    this.createSalesChart()
  },
  beforeUnmount() {
    if (this.salesChart) {
      this.salesChart.destroy()
    }
  },
  methods: {
    async loadDashboardData() {
      this.loading = true
      try {
        await this.reportsStore.fetchDashboardData()
      } catch (error) {
        this.$toast.error('Error al cargar datos del dashboard')
      } finally {
        this.loading = false
      }
    },

    async refreshData() {
      await this.loadDashboardData()
      this.updateSalesChart()
    },

    async createSalesChart() {
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - 7)

      try {
        const salesData = await this.reportsStore.fetchSalesReport({
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
          groupBy: 'day'
        })

        const ctx = this.$refs.salesChart.getContext('2d')
        this.salesChart = new Chart(ctx, {
          type: 'line',
          data: {
            labels: salesData.map(item => item.period),
            datasets: [{
              label: 'Ventas ($)',
              data: salesData.map(item => parseFloat(item.totalAmount || 0)),
              borderColor: 'rgb(75, 192, 192)',
              backgroundColor: 'rgba(75, 192, 192, 0.2)',
              tension: 0.1
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  callback: function(value) {
                    return '$' + value.toLocaleString()
                  }
                }
              }
            }
          }
        })
      } catch (error) {
        console.error('Error creating sales chart:', error)
      }
    },

    updateSalesChart() {
      if (this.salesChart) {
        this.salesChart.destroy()
        this.createSalesChart()
      }
    },

    formatCurrency(value) {
      return parseFloat(value || 0).toLocaleString('es-ES', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })
    }
  }
}