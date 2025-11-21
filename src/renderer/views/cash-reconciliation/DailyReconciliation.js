import { useCashReconciliationStore } from '@/stores/cashReconciliation'
import { storeToRefs } from 'pinia'

const componentLogic = {
  name: 'DailyReconciliation',

  setup() {
    const store = useCashReconciliationStore()
    const { todayReconciliation: reconciliation, dailyReport, isLoading, isReportLoading, error } = storeToRefs(store)

    return {
      reconciliation,
      dailyReport,
      isLoading,
      isReportLoading,
      error,
      store
    }
  },

  data() {
    return {
      openForm: { openingBalanceBs: 0, openingBalanceUsd: 0, notes: '' },
      closeForm: { closingBalanceBs: 0, closingBalanceUsd: 0, notes: '' },
      showReportDialog: false,
      showAdminPasswordDialog: false,
      showConfirmationDialog: false,
      adminPassword: '',
      adminPasswordError: ''
    }
  },

  computed: {
    expectedBalance() {
      if (!this.reconciliation) return 0
      const openingBalanceBs = parseFloat(this.reconciliation.openingBalanceBs || 0)
      const openingBalanceUsd = parseFloat(this.reconciliation.openingBalanceUsd || 0)
      const totalSales = parseFloat(this.reconciliation.totalSales || 0)
      const exchangeRate = this.reconciliation.exchangeRate || 1
      const openingBalanceTotalBs = openingBalanceBs + (openingBalanceUsd * exchangeRate)
      return openingBalanceTotalBs + totalSales
    }
  },

  methods: {
    formatCurrency(value, currency = 'VES') {
      return new Intl.NumberFormat('es-VE', { style: 'currency', currency }).format(value || 0)
    },

    async handleOpenReconciliation() {
      try {
        await this.store.openReconciliation(this.openForm)
        this.openForm = { openingBalanceBs: 0, openingBalanceUsd: 0, notes: '' }
      } catch (e) {
        console.error('Failed to open reconciliation:', e)
      }
    },

    async initiateClose() {
      if (!this.reconciliation) return;
      await this.store.fetchDailyReport(this.reconciliation.id);
      if (this.store.dailyReport) {
        this.showReportDialog = true;
      }
    },

    async handleConfirmAndPrint() {
      const { useAuthStore } = await import('@/stores/auth')
      const authStore = useAuthStore()

      if (authStore.user.role === 'cajero') {
        this.showReportDialog = false
        this.showAdminPasswordDialog = true
      } else {
        this.showReportDialog = false
        this.showConfirmationDialog = true
      }
    },

    async confirmCloseWithAdminPassword() {
      if (!this.adminPassword.trim()) {
        this.adminPasswordError = 'La contraseña es requerida'
        return
      }

      this.adminPasswordError = ''

      try {
        const closeData = {
          ...this.closeForm,
          adminPassword: this.adminPassword
        }
        await this.store.closeReconciliation(closeData)
        this.showAdminPasswordDialog = false
        this.adminPassword = ''
        this.closeForm = { closingBalanceBs: 0, closingBalanceUsd: 0, notes: '' }
      } catch (e) {
        console.error('Failed to close reconciliation:', e)
        this.adminPasswordError = e.message || 'Error al cerrar la caja'
      }
    },

    async confirmClose() {
      try {
        await this.store.closeReconciliation(this.closeForm)
        this.showConfirmationDialog = false
        this.closeForm = { closingBalance: 0, notes: '' }
      } catch (e) {
        console.error('Failed to close reconciliation:', e)
      }
    },

    printReport() {
      const printContent = document.getElementById('printable-report').innerHTML;
      const originalContent = document.body.innerHTML;

      document.body.innerHTML = `
        <html>
          <head>
            <title>Reporte de Cierre de Caja</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .report-header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
              .report-header h2 { margin: 0; }
              .report-info, .report-summary, .report-breakdown { margin-bottom: 20px; }
              .sales-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
              .sales-table th, .sales-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              .sales-table th { background-color: #f2f2f2; font-weight: bold; }
              h3 { color: #333; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
              @media print { body { margin: 0; } }
            </style>
          </head>
          <body>
            ${printContent}
          </body>
        </html>
      `;

      window.print();
      document.body.innerHTML = originalContent;
      window.location.reload(); 
    },

    async confirmAndPrint() {
      if (!this.dailyReport) return;
      this.printReport();
      await this.confirmClose()
    }
  },

  mounted() {
    this.store.fetchTodayReconciliation()
  }
}

export default componentLogic