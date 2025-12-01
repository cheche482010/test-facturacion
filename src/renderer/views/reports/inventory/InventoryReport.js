import { ref, onMounted, watch } from 'vue'
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
    const movements = ref([])

    const filters = ref({
      startDate: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().substr(0, 10),
      endDate: new Date().toISOString().substr(0, 10),
      searchTerm: '',
      movementType: 'Todos'
    })

    const movementTypeOptions = [
      'Todos',
      'Venta',
      'Ajuste Manual',
      'Compra',
      'Devolución'
    ]

    const headers = [
      { title: 'Fecha', key: 'movementDate' },
      { title: 'Producto', key: 'productName' },
      { title: 'Tipo', key: 'movementType', align: 'center' },
      { title: 'Cantidad', key: 'quantity', align: 'center' },
      { title: 'Stock Anterior', key: 'previousStock', align: 'center' },
      { title: 'Stock Nuevo', key: 'newStock', align: 'center' },
      { title: 'Usuario', key: 'userName' },
      { title: 'Referencia', key: 'referenceId' }
    ]

    const loadReport = async () => {
      loading.value = true
      try {
        const params = { ...filters.value }
        if (params.movementType === 'Todos') {
          delete params.movementType
        }
        const data = await reportsStore.fetchInventoryMovementsReport(params)
        movements.value = data.movements
      } catch (error) {
        console.error('Error loading inventory report:', error)
      } finally {
        loading.value = false
      }
    }
    
    const exportToExcel = () => {
      if (movements.value.length === 0) return
      const worksheetData = [
        headers.map(h => h.title),
        ...movements.value.map(item =>
          headers.map(h => {
            const value = item[h.key]
            if (h.key === 'movementDate') {
              return new Date(value).toLocaleString()
            }
            return value
          })
        )
      ]

      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)
      const workbook = XLSX.utils.book_new() 
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Movimientos de Inventario')
      XLSX.writeFile(workbook, 'reporte-movimientos-inventario.xlsx')
    }

    const exportToPDF = () => {
      const doc = new jsPDF()

      doc.setFontSize(16)
      doc.text('Reporte de Inventario', 14, 20)

      doc.setFontSize(10)
      doc.text(`Fecha de generación: ${new Date().toLocaleDateString()}`, 14, 30)
      doc.text(`Tasa USD actual: ${formatCurrency(props.currentDolarRate)} Bs/USD`, 14, 35)

      const tableData = movements.value.map(item =>
        headers.map(h => {
          const value = item[h.key]
          if (h.key === 'movementDate') {
            return new Date(value).toLocaleString()
          }
          return value ?? ''
        })
      )

      autoTable(doc, {
        head: [headers.map(h => h.title)],
        body: tableData,
        startY: 45,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [41, 128, 185] }
      })

      doc.save('reporte-movimientos-inventario.pdf')
    }

    watch(filters, loadReport, { deep: true })

    onMounted(() => {
      loadReport()
    })

    return {
      loading,
      movements,
      filters,
      movementTypeOptions,
      headers,
      loadReport,
      exportToExcel,
      exportToPDF,
      formatCurrency
    }
  }
}