import { ref, computed, onMounted, watch } from 'vue'
import { useReportsStore } from '@/stores/reports'
import { formatCurrency } from '@/utils/formatters'
import ExcelJS from 'exceljs'
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

    const exportOptions = ref({
      formats: {
        excel: false,
        pdf: false
      }
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
      { title: 'Factura', key: 'saleNumber' }
    ]

    const loadReport = async () => {
      loading.value = true
      try {
        const params = { ...filters.value }
        if (params.movementType === 'Todos') {
          delete params.movementType
        }
        if (!params.searchTerm) {
          delete params.searchTerm
        }
        const response = await reportsStore.fetchInventoryMovementsReport(params)
        movements.value = (response.movements || []).map(movement => ({
          ...movement,
          saleNumber: movement.referenceType === 'sale' ? movement.notes.replace('Venta ', '') : ''
        }))
      } catch (error) {
        console.error('Error loading inventory report:', error)
      } finally {
        loading.value = false
      }
    }

    const canExport = computed(() => {
      return exportOptions.value.formats.excel || exportOptions.value.formats.pdf
    })

    const exportReport = async () => {
      if (exportOptions.value.formats.excel) {
        await exportToExcel()
      }
      if (exportOptions.value.formats.pdf) {
        exportToPDF()
      }
    }

    const exportToExcel = async () => {
      if (movements.value.length === 0) return

      const workbook = new ExcelJS.Workbook()
      const worksheet = workbook.addWorksheet('Movimientos de Inventario')


      headers.forEach((header, index) => {
        worksheet.getColumn(index + 1).width = 30
      })

      const headerRow = worksheet.addRow(headers.map(h => h.title))
      headerRow.eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF4CAF50' } 
        }
        cell.font = {
          bold: true,
          color: { argb: 'FFFFFFFF' }
        }
        cell.alignment = { horizontal: 'center' }
      })


      movements.value.forEach(item => {
        const rowData = headers.map(h => {
          const value = item[h.key]
          if (h.key === 'movementDate') {
            return new Date(value).toLocaleString()
          }
          return value || ''
        })
        worksheet.addRow(rowData)
      })

      
      const buffer = await workbook.xlsx.writeBuffer()
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'reporte-movimientos-inventario.xlsx'
      a.click()
      window.URL.revokeObjectURL(url)
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
      exportOptions,
      canExport,
      loadReport,
      exportReport,
      exportToExcel,
      exportToPDF,
      formatCurrency
    }
  }
}