import api from '@/services/api'
import { formatCurrency as fmtCurrency, formatDate as fmtDate } from '@/utils/formatters'

const PAYMENT_LABELS = {
  efectivo_bs: 'Efectivo Bs',
  efectivo_usd: 'Efectivo USD',
  transferencia: 'Transferencia',
  pos: 'POS',
  pago_movil: 'Pago Móvil',
  credito: 'Crédito',
}

export default {
  name: 'CashCount',
  data() {
    const today = new Date()
    const yyyy = today.getFullYear()
    const mm = String(today.getMonth() + 1).padStart(2, '0')
    const dd = String(today.getDate()).padStart(2, '0')
    return {
      selectedDate: `${yyyy}-${mm}-${dd}`,
      cashCount: null,
      loading: false,
      error: null,
    }
  },
  methods: {
    async loadData() {
      this.loading = true
      this.error = null
      try {
        const data = await api.get(`/reports/cash-count?date=${this.selectedDate}`)
        this.cashCount = data
      } catch (e) {
        this.error = e.message || 'Error cargando arqueo'
        console.error(e)
      } finally {
        this.loading = false
      }
    },
    formatCurrency(v) {
      return fmtCurrency(Number(v || 0))
    },
    formatDate(v) {
      return fmtDate(v)
    },
    formatTime(v) {
      if (!v) return ''
      const d = new Date(v)
      return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
    },
    paymentLabel(key) {
      return PAYMENT_LABELS[key] || key
    },
  },
  mounted() {
    this.loadData()
  },
}