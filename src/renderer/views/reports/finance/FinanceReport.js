import { ref, onMounted } from 'vue'
import { useReportsStore } from '@/stores/reports'
import { formatCurrency } from '@/utils/formatters'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export default {
  name: 'FinanceReport',
  props: {
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
      date: ''
    })

    // Headers de la tabla
    const headers = [
      { title: 'Producto', key: 'productName' },
      { title: 'Código', key: 'productCode' },
      { title: 'Cantidad', key: 'quantity', align: 'center' },
      { title: 'Precio Unit BS', key: 'unitPriceBs', align: 'end' },
      { title: 'Precio Unit USD', key: 'unitPriceUsd', align: 'end' },
      { title: 'Subtotal BS', key: 'subtotalBs', align: 'end' },
      { title: 'Subtotal USD', key: 'subtotalUsd', align: 'end' },
      { title: 'Total BS', key: 'totalBs', align: 'end' },
      { title: 'Total USD', key: 'totalUsd', align: 'end' },
      { title: 'Fecha Venta', key: 'saleDate' }
    ]

    // Métodos
    const loadReport = async () => {
      loading.value = true
      try {
        const params = { ...filters.value }
        const result = await reportsStore.fetchFinancialSalesReport(params)
        data.value = result.sales
      } catch (error) {
        console.error('Error loading finance report:', error)
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
            if (h.key === 'saleDate') {
              return new Date(value).toLocaleDateString()
            }
            return value
          })
        )
      ]

      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Financiero')
      XLSX.writeFile(workbook, 'reporte-financiero-ventas.xlsx')
    }

    const exportToPDF = () => {
      if (data.value.length === 0) return
      const doc = new jsPDF()

      doc.setFontSize(16)
      doc.text('Reporte Financiero de Ventas', 14, 20)

      doc.setFontSize(10)
      doc.text(`Fecha de generación: ${new Date().toLocaleDateString()}`, 14, 30)
      doc.text(`Tasa USD actual: ${formatCurrency(props.currentDolarRate)} Bs/USD`, 14, 35)

      const tableData = data.value.map(item =>
        headers.map(h => {
          const value = item[h.key]
          if (h.key.includes('Bs') || h.key.includes('Usd')) {
            return formatCurrency(parseFloat(value) || 0)
          }
          if (h.key === 'saleDate') {
            return new Date(value).toLocaleDateString()
          }
          return value
        })
      )

      autoTable(doc, {
        head: [headers.map(h => h.title)],
        body: tableData,
        startY: 45,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [41, 128, 185] }
      })

      doc.save('reporte-financiero-ventas.pdf')
    }

    // Lifecycle
    onMounted(() => {
      loadReport()
    })

    return {
      loading,
      data,
      filters,
      headers,
      loadReport,
      exportToExcel,
      exportToPDF,
      formatCurrency
    }
  }
}