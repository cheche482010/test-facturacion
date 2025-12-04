import { defineComponent, ref, computed } from 'vue'
import { useCashReconciliationStore } from '@/stores/cashReconciliation'
import { useCurrencyStore } from '@/stores/currencyStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { storeToRefs } from 'pinia'

export default defineComponent({
  name: 'DailyReconciliation',

  setup() {
    const store = useCashReconciliationStore()
    const currencyStore = useCurrencyStore()
    const settingsStore = useSettingsStore()
    const { todayReconciliation: reconciliation, dailyReport, isLoading, isReportLoading, error } = storeToRefs(store)
    const { exchangeRate } = storeToRefs(currencyStore)
    const todaysSales = ref([])
    const showInvoiceDialog = ref(false)
    const openForm = ref({ openingBalanceBs: 0, openingBalanceUsd: 0, notes: '' })
    const closeForm = ref({ closingBalanceBs: 0, closingBalanceUsd: 0, notes: '' })
    const showReportDialog = ref(false)
    const showAdminPasswordDialog = ref(false)
    const showConfirmationDialog = ref(false)
    const adminPassword = ref('')
    const adminPasswordError = ref('')
    const selectedSale = ref(null)

    const expectedBalance = computed(() => {
      if (!reconciliation.value) return 0
      const openingBalanceBs = parseFloat(reconciliation.value.openingBalanceBs || 0)
      const openingBalanceUsd = parseFloat(reconciliation.value.openingBalanceUsd || 0)
      const totalSales = parseFloat(reconciliation.value.totalSales || 0)
      const exchangeRateValue = reconciliation.value.exchangeRate || 1
      const openingBalanceTotalBs = openingBalanceBs + (openingBalanceUsd * exchangeRateValue)
      return openingBalanceTotalBs + totalSales
    })

    const todaysSalesItems = computed(() => todaysSales.value || [])

    const salesHeaders = computed(() => [
      { title: 'Factura', key: 'saleNumber', sortable: true },
      { title: 'Fecha', key: 'sale_date', sortable: true },
      { title: 'Total BS', key: 'totalBs', sortable: true },
      { title: 'Total USD', key: 'totalUsd', sortable: true },
      { title: 'Acciones', key: 'actions', sortable: false }
    ])

    const productHeaders = computed(() => [
      { title: 'Producto', key: 'product.name' },
      { title: 'Cantidad', key: 'quantity' },
      { title: 'Precio', key: 'unitPriceBs' },
      { title: 'Subtotal', key: 'subtotalBs' }
    ])

    const paymentHeaders = computed(() => [
      { title: 'Método', key: 'paymentMethod.name' },
      { title: 'Monto', key: 'amount' },
      { title: 'Referencia', key: 'reference' },
      { title: 'Notas', key: 'notes' }
    ])

    const totalQuantity = computed(() => {
      if (!selectedSale.value?.items) return 0
      return selectedSale.value.items.reduce((sum, item) => sum + parseInt(item.quantity), 0)
    })

    const totalPaid = computed(() => {
      if (!selectedSale.value?.payments) return 0
      return selectedSale.value.payments.reduce((sum, payment) => sum + parseFloat(payment.amount), 0)
    })

    const changeAmount = computed(() => {
      if (!selectedSale.value) return 0
      return Math.max(0, totalPaid.value - parseFloat(selectedSale.value.totalBs))
    })

    const changeCurrency = computed(() => 'VES')

    const company = computed(() => ({
      name: settingsStore.settings.company_name || 'Mi Empresa',
      rif: settingsStore.settings.company_rif || 'J-12345678-9',
      address: settingsStore.settings.company_address || 'Dirección de la empresa',
      phone: settingsStore.settings.company_phone || '+58 212 123 4567',
      email: settingsStore.settings.company_email || 'info@empresa.com'
    }))

    const formatCurrency = (value, currency = 'VES') => {
      return new Intl.NumberFormat('es-VE', { style: 'currency', currency }).format(value || 0)
    }

    const handleOpenReconciliation = async () => {
      try {
        await store.openReconciliation(openForm.value)
        openForm.value = { openingBalanceBs: 0, openingBalanceUsd: 0, notes: '' }
      } catch (e) {
        console.error('Failed to open reconciliation:', e)
      }
    }

    const initiateClose = async () => {
      if (!reconciliation.value) return
      await store.fetchDailyReport(reconciliation.value.id)
      if (store.dailyReport) {
        showReportDialog.value = true
      }
    }

    const handleConfirmAndPrint = async () => {
      const { useAuthStore } = await import('@/stores/auth')
      const authStore = useAuthStore()

      if (authStore.user.role === 'cajero') {
        showReportDialog.value = false
        showAdminPasswordDialog.value = true
      } else {
        showReportDialog.value = false
        showConfirmationDialog.value = true
      }
    }

    const confirmCloseWithAdminPassword = async () => {
      if (!adminPassword.value.trim()) {
        adminPasswordError.value = 'La contraseña es requerida'
        return
      }

      adminPasswordError.value = ''

      try {
        const closeData = {
          ...closeForm.value,
          adminPassword: adminPassword.value
        }
        await store.closeReconciliation(closeData)
        showAdminPasswordDialog.value = false
        adminPassword.value = ''
        closeForm.value = { closingBalanceBs: 0, closingBalanceUsd: 0, notes: '' }
      } catch (e) {
        console.error('Failed to close reconciliation:', e)
        adminPasswordError.value = e.message || 'Error al cerrar la caja'
      }
    }

    const confirmClose = async () => {
      try {
        await store.closeReconciliation(closeForm.value)
        showConfirmationDialog.value = false
        closeForm.value = { closingBalance: 0, notes: '' }
      } catch (e) {
        console.error('Failed to close reconciliation:', e)
      }
    }

    const printReport = () => {
      const printContent = document.getElementById('printable-report').innerHTML
      const originalContent = document.body.innerHTML

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
      `

      window.print()
      document.body.innerHTML = originalContent
      window.location.reload()
    }

    const confirmAndPrint = async () => {
      if (!dailyReport.value) return
      printReport()
      await confirmClose()
    }

    const fetchTodaysSales = async () => {
      if (!reconciliation.value) return
      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/sales/today`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        })
        if (response.ok) {
          todaysSales.value = await response.json()
        }
      } catch (error) {
        console.error('Error fetching today\'s sales:', error)
      }
    }

    const viewInvoice = (sale) => {
      selectedSale.value = sale
      showInvoiceDialog.value = true
    }

    const formatDate = (date) => {
      return new Date(date).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }

    const getIconForMethod = (name) => {
      const icons = {
        'Efectivo BS': 'mdi-cash',
        'Efectivo USD': 'mdi-cash-multiple',
        'Transferencia': 'mdi-bank-transfer',
        'POS': 'mdi-credit-card-chip',
        'Pago Móvil': 'mdi-cellphone',
        'Crédito': 'mdi-credit-card'
      }
      return icons[name] || 'mdi-cash'
    }

    const printInvoice = () => {
      const printContent = document.getElementById('invoice-print').innerHTML
      const printWindow = window.open('', '_blank')
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
      `)
      printWindow.document.close()
      printWindow.print()
    }

    return {
      reconciliation,
      dailyReport,
      isLoading,
      isReportLoading,
      error,
      store,
      todaysSales,
      exchangeRate,
      openForm,
      closeForm,
      showReportDialog,
      showAdminPasswordDialog,
      showConfirmationDialog,
      adminPassword,
      adminPasswordError,
      showInvoiceDialog,
      selectedSale,
      expectedBalance,
      todaysSalesItems,
      salesHeaders,
      productHeaders,
      paymentHeaders,
      totalQuantity,
      totalPaid,
      changeAmount,
      changeCurrency,
      company,
      formatCurrency,
      handleOpenReconciliation,
      initiateClose,
      handleConfirmAndPrint,
      confirmCloseWithAdminPassword,
      confirmClose,
      confirmAndPrint,
      fetchTodaysSales,
      viewInvoice,
      formatDate,
      getIconForMethod,
      printInvoice
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
})