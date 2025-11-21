import { ref, computed, onMounted } from 'vue'
import { useReportsStore } from '@/stores/reports'
import { formatCurrency } from '@/utils/formatters'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export default {
  name: 'SalesReport',
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

    const filters = ref({
      startDate: props.startDate,
      endDate: props.endDate,
      batch: ''
    })

    const headers = [
      { title: 'Número de Venta', key: 'saleNumber' },
      { title: 'Fecha', key: 'saleDate' },
      { title: 'Usuario', key: 'userName' },
      { title: 'Total BS', key: 'totalBs', align: 'end' },
      { title: 'Total USD', key: 'totalUsd', align: 'end' },
      { title: 'Tasa USD', key: 'dolarRateAtSale', align: 'end' },
      { title: 'Estado', key: 'paymentStatus' }
    ]

    const loadReport = async () => {
      loading.value = true
      try {
        const params = { ...filters.value }
        const result = await reportsStore.fetchDetailedSalesReport(params)
        data.value = result.sales
      } catch (error) {
        console.error('Error loading sales report:', error)
      } finally {
        loading.value = false
      }
    }

    const loadAllReport = async () => {
      loading.value = true
      try {
        const params = {
          startDate: '2020-01-01',
          endDate: new Date().toISOString().substr(0, 10)
        }
        const result = await reportsStore.fetchDetailedSalesReport(params)
        data.value = result.sales
      } catch (error) {
        console.error('Error loading all sales report:', error)
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
            return value
          })
        )
      ]

      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Ventas')
      XLSX.writeFile(workbook, 'reporte-ventas.xlsx')
    }

    const exportToPDF = () => {
      if (data.value.length === 0) return
      const doc = new jsPDF()

      doc.setFontSize(16)
      doc.text('Reporte de Ventas', 14, 20)

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

      doc.save('reporte-ventas.pdf')
    }

    onMounted(() => {
      loadReport()
    })

    return {
      loading,
      data,
      filters,
      headers,
      loadReport,
      loadAllReport,
      exportToExcel,
      exportToPDF,
      formatCurrency
    }
  }
}