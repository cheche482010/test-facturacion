import { ref, computed } from 'vue'
import { useCashReconciliationStore } from '@/stores/cashReconciliation'
import { useCurrencyStore } from '@/stores/currencyStore'
import { storeToRefs } from 'pinia'

const componentLogic = {
  name: 'DailyReconciliation',

  setup() {
    const store = useCashReconciliationStore()
    const currencyStore = useCurrencyStore()
    const { todayReconciliation: reconciliation, dailyReport, isLoading, isReportLoading, error } = storeToRefs(store)
    const { exchangeRate } = storeToRefs(currencyStore)
    const todaysSales = ref([])
    const showInvoiceDialog = ref(false)

    return {
      reconciliation,
      dailyReport,
      isLoading,
      isReportLoading,
      error,
      store,
      todaysSales,
      exchangeRate
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
      adminPasswordError: '',
      showInvoiceDialog: false,
      company: {
        name: 'Mi Empresa',
        rif: 'J-12345678-9',
        address: 'Dirección de la empresa',
        phone: '0212-1234567'
      }
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
    },

    todaysSalesItems() {
      return this.todaysSales.value || []
    },

    salesHeaders() {
      return [
        { title: 'Factura', key: 'saleNumber', sortable: true },
        { title: 'Fecha', key: 'sale_date', sortable: true },
        { title: 'Total BS', key: 'totalBs', sortable: true },
        { title: 'Total USD', key: 'totalUsd', sortable: true },
        { title: 'Acciones', key: 'actions', sortable: false }
      ]
    },

    productHeaders() {
      return [
        { title: 'Producto', key: 'product.name' },
        { title: 'Cantidad', key: 'quantity' },
        { title: 'Precio', key: 'unitPriceBs' },
        { title: 'Subtotal', key: 'subtotalBs' }
      ]
    },

    paymentHeaders() {
      return [
        { title: 'Método', key: 'paymentMethod.name' },
        { title: 'Monto', key: 'amount' },
        { title: 'Referencia', key: 'reference' },
        { title: 'Notas', key: 'notes' }
      ]
    },

    totalQuantity() {
      if (!this.selectedSale?.items) return 0
      return this.selectedSale.items.reduce((sum, item) => sum + parseInt(item.quantity), 0)
    },

    totalPaid() {
      if (!this.selectedSale?.payments) return 0
      return this.selectedSale.payments.reduce((sum, payment) => sum + parseFloat(payment.amount), 0)
    },

    changeAmount() {
      if (!this.selectedSale) return 0
      return Math.max(0, this.totalPaid - parseFloat(this.selectedSale.totalBs))
    },

    changeCurrency() {
      return 'VES'
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
    },

    async fetchTodaysSales() {
      if (!this.reconciliation) return;
      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/sales/today`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (response.ok) {
          this.todaysSales.value = await response.json();
        }
      } catch (error) {
        console.error('Error fetching today\'s sales:', error);
      }
    },

    viewInvoice(sale) {
      this.selectedSale = sale;
      this.showInvoiceDialog = true;
    },

    formatDate(date) {
      return new Date(date).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    },

    getIconForMethod(name) {
      const icons = {
        'Efectivo BS': 'mdi-cash',
        'Efectivo USD': 'mdi-cash-multiple',
        'Transferencia': 'mdi-bank-transfer',
        'POS': 'mdi-credit-card-chip',
        'Pago Móvil': 'mdi-cellphone',
        'Crédito': 'mdi-credit-card'
      }
      return icons[name] || 'mdi-cash'
    },

    printInvoice() {
      const printContent = document.getElementById('invoice-print').innerHTML;
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <html>
          <head>
            <title>Factura de Venta</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .text-center { text-align: center; }
              .text-right { text-align: right; }
              .mb-4 { margin-bottom: 20px; }
              .mt-4 { margin-top: 20px; }
              .invoice-table, .product-table, .payment-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
              .invoice-table th, .invoice-table td, .product-table th, .product-table td, .payment-table th, .payment-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              .invoice-table th, .product-table th, .payment-table th { background-color: #f2f2f2; }
              .total-row { background-color: #f9f9f9; font-weight: bold; }
              h2, h4 { margin: 0; }
              @media print { body { margin: 0; } }
            </style>
          </head>
          <body>
            ${printContent}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  },

  mounted() {
    this.store.fetchTodayReconciliation()
  },

  watch: {
    reconciliation: {
      handler(newReconciliation) {
        if (newReconciliation) {
          this.fetchTodaysSales()
        }
      },
      immediate: true
    }
  }
}

export default componentLogic