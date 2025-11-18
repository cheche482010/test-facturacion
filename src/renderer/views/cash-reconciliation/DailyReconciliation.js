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
      openForm: { openingBalance: 0, notes: '' },
      closeForm: { closingBalance: 0, notes: '' },
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
      const openingBalance = parseFloat(this.reconciliation.openingBalance || 0)
      const totalSales = parseFloat(this.reconciliation.totalSales || 0)
      // El saldo esperado debe considerar el vuelto dado que reduce el efectivo en caja
      // Pero como no tenemos el total de vuelto en tiempo real, usamos la fórmula simplificada
      return openingBalance + totalSales
    }
  },

  methods: {
    formatCurrency(value, currency = 'VES') {
      return new Intl.NumberFormat('es-VE', { style: 'currency', currency }).format(value || 0)
    },

    async handleOpenReconciliation() {
      try {
        await this.store.openReconciliation(this.openForm)
        this.openForm = { openingBalance: 0, notes: '' }
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
      // Import auth store to check user role
      const { useAuthStore } = await import('@/stores/auth')
      const authStore = useAuthStore()

      if (authStore.user.role === 'cajero') {
        // For cajeros, show admin password dialog
        this.showReportDialog = false
        this.showAdminPasswordDialog = true
      } else {
        // For admin/dev, show confirmation dialog
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
        this.closeForm = { closingBalance: 0, notes: '' }
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
      window.location.reload(); // Recargar para restaurar la funcionalidad de Vue
    },

    async confirmAndPrint() {
      if (!this.dailyReport) return;

      // Primero imprimir el reporte
      this.printReport();

      // Luego confirmar el cierre
      await this.confirmClose()
    }
  },

  mounted() {
    this.store.fetchTodayReconciliation()
  }
}

export default componentLogic