import { ref, onMounted } from 'vue'
import { useReportsStore } from '@/stores/reports'
import { formatCurrency } from '@/utils/formatters'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export default {
  name: 'InventoryReport',
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

    const filters = ref({
      status: 'all'
    })

    const statusOptions = [
      { title: 'Todos', value: 'all' },
      { title: 'Stock Bajo', value: 'low' },
      { title: 'Agotado', value: 'out' }
    ]

    const headers = [
      { title: 'Código', key: 'internalCode' },
      { title: 'Producto', key: 'name' },
      { title: 'Stock', key: 'currentStock', align: 'center' },
      { title: 'Precio Venta BS', key: 'retailPriceBs', align: 'end' },
      { title: 'Precio Venta USD', key: 'retailPriceUsd', align: 'end' },
      { title: 'Estado', key: 'status' }
    ]

    const loadReport = async () => {
      loading.value = true
      try {
        const params = { ...filters.value }
        const result = await reportsStore.fetchDetailedInventoryReport(params)
        data.value = result.products
      } catch (error) {
        console.error('Error loading inventory report:', error)
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
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventario')
      XLSX.writeFile(workbook, 'reporte-inventario.xlsx')
    }

    const exportToPDF = () => {
      if (data.value.length === 0) return
      const doc = new jsPDF()

      doc.setFontSize(16)
      doc.text('Reporte de Inventario', 14, 20)

      doc.setFontSize(10)
      doc.text(`Fecha de generación: ${new Date().toLocaleDateString()}`, 14, 30)
      doc.text(`Tasa USD actual: ${formatCurrency(props.currentDolarRate)} Bs/USD`, 14, 35)

      const tableData = data.value.map(item =>
        headers.map(h => {
          const value = item[h.key]
          if (h.key.includes('Bs') || h.key.includes('Usd')) {
            return formatCurrency(parseFloat(value) || 0)
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

      doc.save('reporte-inventario.pdf')
    }

    onMounted(() => {
      loadReport()
    })

    return {
      loading,
      data,
      filters,
      statusOptions,
      headers,
      loadReport,
      exportToExcel,
      exportToPDF,
      formatCurrency
    }
  }
}