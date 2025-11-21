import { ref, onMounted } from 'vue'
import { useReportsStore } from '@/stores/reports'
import { formatCurrency } from '@/utils/formatters'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

export default {
  name: 'AdjustmentsReport',
  props: {
    startDate: {
      type: String,
      default: () => {
        const today = new Date()
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
        return firstDayOfMonth.toISOString().substr(0, 10)
      }
    },
    endDate: {
      type: String,
      default: () => new Date().toISOString().substr(0, 10)
    },
    currentDolarRate: {
      type: Number,
      default: 0
    }
  },
  setup(props) {
    const reportsStore = useReportsStore()
    const loading = ref(false)
    const data = ref([])

    // Filtros locales
    const filters = ref({
      startDate: props.startDate,
      endDate: props.endDate,
      type: ''
    })

    // Opciones para filtros
    const typeOptions = [
      { title: 'Todos', value: '' },
      { title: 'Ventas', value: 'sales' },
      { title: 'Ajustes', value: 'adjustments' }
    ]

    // Headers de la tabla
    const headers = [
      { title: 'Producto', key: 'productName' },
      { title: 'Tipo', key: 'movementType' },
      { title: 'Razón', key: 'reason' },
      { title: 'Cantidad', key: 'quantity', align: 'center' },
      { title: 'Costo Unit BS', key: 'unitCostBs', align: 'end' },
      { title: 'Costo Unit USD', key: 'unitCostUsd', align: 'end' },
      { title: 'Costo Total BS', key: 'totalCostBs', align: 'end' },
      { title: 'Costo Total USD', key: 'totalCostUsd', align: 'end' },
      { title: 'Fecha', key: 'movementDate' },
      { title: 'Usuario', key: 'userName' }
    ]

    // Métodos
    const loadReport = async () => {
      loading.value = true
      try {
        const params = { ...filters.value }
        const result = await reportsStore.fetchInventoryAdjustmentsReport(params)
        data.value = result.movements
      } catch (error) {
        console.error('Error loading adjustments report:', error)
      } finally {
        loading.value = false
      }
    }

    const exportToExcel = () => {
      if (data.value.length === 0) return
      const worksheetData = [
        headers.map(h => h.title),
        ...data.value.map(item =>
          headers.map(h => {
            const value = item[h.key]
            if (h.key.includes('Bs') || h.key.includes('Usd')) {
              return parseFloat(value) || 0
            }
            if (h.key === 'movementDate') {
              return new Date(value).toLocaleDateString()
            }
            return value
          })
        )
      ]

      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Ajustes')
      XLSX.writeFile(workbook, 'reporte-ajustes-inventario.xlsx')
    }

    const exportToPDF = () => {
      if (data.value.length === 0) return
      const doc = new jsPDF()

      doc.setFontSize(16)
      doc.text('Reporte de Ajustes de Inventario', 14, 20)

      doc.setFontSize(10)
      doc.text(`Fecha de generación: ${new Date().toLocaleDateString()}`, 14, 30)
      doc.text(`Tasa USD actual: ${formatCurrency(props.currentDolarRate)} Bs/USD`, 14, 35)

      const tableData = data.value.map(item =>
        headers.map(h => {
          const value = item[h.key]
          if (h.key.includes('Bs') || h.key.includes('Usd')) {
            return formatCurrency(parseFloat(value) || 0)
          }
          if (h.key === 'movementDate') {
            return new Date(value).toLocaleDateString()
          }
          return value
        })
      )

      doc.autoTable({
        head: [headers.map(h => h.title)],
        body: tableData,
        startY: 45,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [41, 128, 185] }
      })

      doc.save('reporte-ajustes-inventario.pdf')
    }

    // Lifecycle
    onMounted(() => {
      loadReport()
    })

    return {
      loading,
      data,
      filters,
      typeOptions,
      headers,
      loadReport,
      exportToExcel,
      exportToPDF,
      formatCurrency
    }
  }
}