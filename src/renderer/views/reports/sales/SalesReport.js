import { ref, computed, onMounted, watch } from 'vue'
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
    const summary = ref(null)
    const expandedBatches = ref([])
    const expandedSales = ref([])

    const filters = ref({
      startDate: props.startDate,
      endDate: props.endDate,
      batch: ''
    })

    const exportOptions = ref({
      exportAll: true,
      selectedBatches: [],
      formats: {
        excel: false,
        pdf: false
      }
    })

    const batchHeaders = [
      { title: 'Lote', key: 'lote' },
      { title: 'Fecha Apertura', key: 'openingDate' },
      { title: 'Fecha Cierre', key: 'closingDate' },
      { title: 'Ventas', key: 'totalSales', align: 'center' },
      { title: 'Total BS', key: 'totalAmountBs', align: 'end' },
      { title: 'Vendido BS', key: 'totalSoldBs', align: 'end' },
      { title: 'Cambio BS', key: 'totalChangeGivenBs', align: 'end' },
      { title: '', key: 'data-table-expand' }
    ]

    const saleHeaders = [
      { title: 'Número de Venta', key: 'saleNumber' },
      { title: 'Fecha', key: 'saleDate' },
      { title: 'Usuario', key: 'userName' },
      { title: 'Total BS', key: 'totalBs', align: 'end' },
      { title: 'Vendido BS', key: 'totalSoldBs', align: 'end' },
      { title: 'Cambio BS', key: 'changeGivenBs', align: 'end' },
      { title: '', key: 'data-table-expand' }
    ]

    const productHeaders = [
      { title: 'Nombre', key: 'productName', width: '45%' },
      { title: 'Código', key: 'productCode', align: 'center', width: '20%' },
      { title: 'Cantidad', key: 'quantity', align: 'center', width: '15%' },
      { title: 'Total', key: 'subtotalBs', align: 'end', width: '20%' }
    ]

    const loadReport = async () => {
      loading.value = true
      try {
        const params = { ...filters.value }
        const result = await reportsStore.fetchDetailedSalesReportByBatches(params)
        data.value = result.batches
        summary.value = result.summary
      } catch (error) {
        console.error('Error loading sales report by batches:', error)
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
        const result = await reportsStore.fetchDetailedSalesReportByBatches(params)
        data.value = result.batches
        summary.value = result.summary
      } catch (error) {
        console.error('Error loading all sales report by batches:', error)
      } finally {
        loading.value = false
      }
    }

    const exportToExcel = async (batchesToExport = null) => {
      const batches = batchesToExport || getFilteredBatches()

      if (!batches || batches.length === 0) {
        alert('No hay datos para exportar.')
        return
      }

      const workbook = XLSX.utils.book_new()

      // Hoja de resumen general
      const summaryHeaders = ['Métrica', 'Valor']
      const summaryData = [
        ['Total Lotes', summary.value?.totalBatches || 0],
        ['Total Ventas', summary.value?.totalSales || 0],
        ['Monto Total BS', summary.value?.totalAmountBs || 0],
        ['Total Vendido BS', summary.value?.totalSoldBs || 0],
        ['Cambio Total BS', summary.value?.totalChangeGivenBs || 0],
        ['Fecha de Generación', new Date().toLocaleDateString()],
        ['Tasa USD Actual', formatCurrency(props.currentDolarRate)]
      ]
      const summaryWorksheet = XLSX.utils.aoa_to_sheet([summaryHeaders, ...summaryData])
      XLSX.utils.book_append_sheet(workbook, summaryWorksheet, 'Resumen General')

      // Crear una hoja por lote con estructura jerárquica completa
      batches.forEach((batch, batchIndex) => {
        const batchData = []

        // Encabezado del lote
        batchData.push(['REPORTE DE VENTAS POR LOTES - DETALLADO'])
        batchData.push(['Sistema de Facturación'])
        batchData.push(['Fecha de generación:', new Date().toLocaleDateString()])
        batchData.push(['Tasa USD actual:', formatCurrency(props.currentDolarRate) + ' Bs/USD'])
        batchData.push([])

        batchData.push(['INFORMACIÓN DEL LOTE'])
        batchData.push(['Lote', batch.lote || 'N/A'])
        batchData.push(['Fecha Apertura', batch.openingDate ? new Date(batch.openingDate).toLocaleDateString() : 'N/A'])
        batchData.push(['Fecha Cierre', batch.closingDate ? new Date(batch.closingDate).toLocaleDateString() : 'En curso'])
        batchData.push(['Total Ventas', batch.summary?.totalSales || 0])
        batchData.push(['Total BS', batch.summary?.totalAmountBs || 0])
        batchData.push(['Vendido BS', batch.summary?.totalSoldBs || 0])
        batchData.push(['Cambio BS', batch.summary?.totalChangeGivenBs || 0])
        batchData.push([]) // Fila vacía

        // Verificar si hay ventas en el lote
        if (batch.sales && batch.sales.length > 0) {
          // Ventas del lote
          batchData.push(['VENTAS DEL LOTE'])
          batchData.push(['Número Venta', 'Fecha', 'Usuario', 'Total BS', 'Vendido BS', 'Cambio BS', 'Productos', 'Métodos Pago'])

          batch.sales.forEach((sale, saleIndex) => {
            batchData.push([
              sale.saleNumber || 'N/A',
              sale.saleDate ? new Date(sale.saleDate).toLocaleDateString() : 'N/A',
              sale.userName || 'Usuario Desconocido',
              sale.totalBs || 0,
              sale.totalSoldBs || 0,
              sale.changeGivenBs || 0,
              sale.items ? sale.items.length : 0,
              sale.payments ? sale.payments.length : 0
            ])

            // Productos de la venta
            batchData.push([]) // Fila vacía
            batchData.push(['    PRODUCTOS VENDIDOS', '', '', '', ''])
            batchData.push(['    Nombre', 'Código', 'Cantidad', 'Total BS'])

            if (sale.items && Array.isArray(sale.items) && sale.items.length > 0) {
              sale.items.forEach(item => {
                batchData.push([
                  '    ' + (item.productName || item.name || 'Producto Desconocido'),
                  item.productCode || item.internalCode || 'N/A',
                  item.quantity || 0,
                  item.subtotalBs || item.totalBs || 0
                ])
              })
            } else {
              batchData.push(['    No hay productos registrados', '', '', ''])
            }

            // Métodos de pago de la venta
            batchData.push([]) // Fila vacía
            batchData.push(['    MÉTODOS DE PAGO', '', '', ''])
            batchData.push(['    Método', 'Monto BS', 'Referencia'])

            if (sale.payments && Array.isArray(sale.payments) && sale.payments.length > 0) {
              sale.payments.forEach(payment => {
                batchData.push([
                  '    ' + (payment.methodName || payment.name || 'Método Desconocido'),
                  payment.amount || 0,
                  payment.reference || ''
                ])
              })
            } else {
              batchData.push(['    No hay métodos de pago registrados', '', ''])
            }

            batchData.push([]) // Fila vacía entre ventas
            batchData.push(['--- FIN DE VENTA ---', '', '', '', ''])
            batchData.push([]) // Fila vacía
          })
        } else {
          batchData.push(['No hay ventas registradas en este lote'])
        }

        const batchWorksheet = XLSX.utils.aoa_to_sheet(batchData)

        // Aplicar estilos básicos
        if (batchWorksheet['!cols']) {
          batchWorksheet['!cols'] = [
            { width: 20 }, // Columna A
            { width: 15 }, // Columna B
            { width: 12 }, // Columna C
            { width: 12 }, // Columna D
            { width: 12 }, // Columna E
          ]
        }

        XLSX.utils.book_append_sheet(workbook, batchWorksheet, `Lote ${batch.lote || batchIndex + 1}`)
      })

      XLSX.writeFile(workbook, 'reporte-ventas-por-lotes-completo.xlsx')
      console.log('Archivo Excel generado y enviado al navegador para descarga')
    }

    const exportToPDF = async (batchesToExport = null) => {
      const filteredBatches = batchesToExport || getFilteredBatches()
      if (!filteredBatches || filteredBatches.length === 0) {
        alert('No hay lotes seleccionados para exportar.')
        return
      }

      console.log('Iniciando exportación a PDF con', filteredBatches.length, 'lotes')

      const doc = new jsPDF()

      // Portada
      doc.setFontSize(20)
      doc.setTextColor(25, 118, 210)
      doc.text('REPORTE DE VENTAS POR LOTES', 14, 30)
      doc.setTextColor(0, 0, 0)

      doc.setFontSize(14)
      doc.text('Sistema de Facturación', 14, 45)

      doc.setFontSize(10)
      doc.text(`Fecha de generación: ${new Date().toLocaleDateString()}`, 14, 65)
      doc.text(`Tasa USD actual: ${formatCurrency(props.currentDolarRate)} Bs/USD`, 14, 75)

      // Resumen general
      if (summary.value) {
        doc.setFontSize(14)
        doc.setTextColor(76, 175, 80)
        doc.text('RESUMEN GENERAL', 14, 95)
        doc.setTextColor(0, 0, 0)

        doc.setFontSize(10)
        doc.text(`Total Lotes: ${summary.value.totalBatches || 0}`, 14, 110)
        doc.text(`Total Ventas: ${summary.value.totalSales || 0}`, 14, 120)
        doc.text(`Monto Total: ${formatCurrency(summary.value.totalAmountBs || 0)} Bs`, 14, 130)
        doc.text(`Total Vendido: ${formatCurrency(summary.value.totalSoldBs || 0)} Bs`, 14, 140)
        doc.text(`Cambio Total: ${formatCurrency(summary.value.totalChangeGivenBs || 0)} Bs`, 14, 150)
      }

      // Nueva página para tabla de lotes
      doc.addPage()
      doc.setFontSize(16)
      doc.setTextColor(25, 118, 210)
      doc.text('RESUMEN POR LOTES', 14, 20)
      doc.setTextColor(0, 0, 0)

      const batchHeaders = ['Lote', 'Fecha Apertura', 'Ventas', 'Total BS', 'Vendido BS', 'Cambio BS']
      const batchData = filteredBatches.map(batch => [
        batch.lote || 'N/A',
        batch.openingDate ? new Date(batch.openingDate).toLocaleDateString() : 'N/A',
        batch.summary?.totalSales || 0,
        formatCurrency(batch.summary?.totalAmountBs || 0),
        formatCurrency(batch.summary?.totalSoldBs || 0),
        formatCurrency(batch.summary?.totalChangeGivenBs || 0)
      ])

      autoTable(doc, {
        head: [batchHeaders],
        body: batchData,
        startY: 30,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [25, 118, 210] },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        margin: { top: 30 }
      })

      // Detalles por lote - estructura simplificada
      filteredBatches.forEach((batch, batchIndex) => {
        doc.addPage()

        // Título del lote
        doc.setFontSize(16)
        doc.setTextColor(25, 118, 210)
        doc.text(`LOTE ${batch.lote || 'N/A'}`, 14, 20)
        doc.setTextColor(0, 0, 0)

        // Información básica del lote
        doc.setFontSize(10)
        doc.text(`Fecha: ${batch.openingDate ? new Date(batch.openingDate).toLocaleDateString() : 'N/A'}`, 14, 35)
        doc.text(`Ventas: ${batch.summary?.totalSales || 0} | Total: ${formatCurrency(batch.summary?.totalAmountBs || 0)} Bs`, 14, 45)

        let yPosition = 60

        // Verificar si hay ventas
        if (!batch.sales || batch.sales.length === 0) {
          doc.setFontSize(12)
          doc.setTextColor(244, 67, 54)
          doc.text('No hay ventas registradas en este lote', 14, yPosition)
          doc.setTextColor(0, 0, 0)
          return
        }

        // Tabla de ventas del lote
        const saleHeaders = ['Venta', 'Fecha', 'Usuario', 'Total BS', 'Productos', 'Pagos']
        const saleData = batch.sales.map(sale => [
          sale.saleNumber || 'N/A',
          sale.saleDate ? new Date(sale.saleDate).toLocaleDateString() : 'N/A',
          sale.userName || 'N/A',
          formatCurrency(sale.totalBs || 0),
          sale.items ? sale.items.length : 0,
          sale.payments ? sale.payments.length : 0
        ])

        autoTable(doc, {
          head: [saleHeaders],
          body: saleData,
          startY: yPosition,
          styles: { fontSize: 8 },
          headStyles: { fillColor: [76, 175, 80] },
          alternateRowStyles: { fillColor: [245, 245, 245] },
          margin: { left: 14, right: 14 }
        })

        yPosition = doc.lastAutoTable.finalY + 15

        // Detalles de cada venta
        batch.sales.forEach((sale, saleIndex) => {
          if (yPosition > 250) {
            doc.addPage()
            yPosition = 20
          }

          // Encabezado de venta individual
          doc.setFontSize(11)
          doc.setTextColor(76, 175, 80)
          doc.text(`DETALLE VENTA ${sale.saleNumber || 'N/A'}`, 14, yPosition)
          doc.setTextColor(0, 0, 0)
          yPosition += 8

          // Productos de la venta
          if (sale.items && sale.items.length > 0) {
            doc.setFontSize(9)
            doc.setTextColor(100, 100, 100)
            doc.text('Productos:', 14, yPosition)
            doc.setTextColor(0, 0, 0)
            yPosition += 6

            sale.items.forEach(item => {
              if (yPosition > 270) {
                doc.addPage()
                yPosition = 20
              }
              doc.setFontSize(8)
              doc.text(`• ${item.productName || 'Producto'} (${item.productCode || 'N/A'}): ${item.quantity || 0} x ${formatCurrency(item.subtotalBs || 0)} Bs`, 20, yPosition)
              yPosition += 5
            })
            yPosition += 3
          }

          // Métodos de pago de la venta
          if (sale.payments && sale.payments.length > 0) {
            if (yPosition > 260) {
              doc.addPage()
              yPosition = 20
            }

            doc.setFontSize(9)
            doc.setTextColor(100, 100, 100)
            doc.text('Pagos:', 14, yPosition)
            doc.setTextColor(0, 0, 0)
            yPosition += 6

            sale.payments.forEach(payment => {
              if (yPosition > 270) {
                doc.addPage()
                yPosition = 20
              }
              doc.setFontSize(8)
              doc.text(`• ${payment.methodName || 'Método'}: ${formatCurrency(payment.amount || 0)} Bs ${payment.reference ? `(${payment.reference})` : ''}`, 20, yPosition)
              yPosition += 5
            })
          }

          // Cambio si existe
          if (sale.changeGivenBs && sale.changeGivenBs > 0) {
            doc.setFontSize(8)
            doc.setTextColor(255, 152, 0)
            doc.text(`Cambio dado: ${formatCurrency(sale.changeGivenBs)} Bs`, 14, yPosition)
            doc.setTextColor(0, 0, 0)
          }

          yPosition += 10

          // Línea separadora
          doc.setDrawColor(200, 200, 200)
          doc.line(14, yPosition, 190, yPosition)
          yPosition += 8
        })
      })

      doc.save('reporte-ventas-por-lotes-completo.pdf')
      console.log('Archivo PDF generado y enviado al navegador para descarga')
    }

    const getBatchRowClass = (item) => {
      return expandedBatches.value.includes(item.id) ? 'selected-batch-row' : ''
    }

    const getSaleRowClass = (item) => {
      return expandedSales.value.includes(item.id) ? 'selected-sale-row' : ''
    }

    const getTotalProductUnits = (items) => {
      return items.reduce((total, item) => total + parseInt(item.quantity), 0)
    }

    const onExportAllChange = () => {
      if (exportOptions.value.exportAll) {
        exportOptions.value.selectedBatches = []
      }
    }

    const canExport = computed(() => {
      const hasData = exportOptions.value.exportAll || exportOptions.value.selectedBatches.length > 0
      const hasFormat = exportOptions.value.formats.excel || exportOptions.value.formats.pdf
      return hasData && hasFormat && data.value && data.value.length > 0
    })

    const getFilteredBatches = () => {
      if (exportOptions.value.exportAll) {
        return data.value
      }

      return data.value.filter(batch => exportOptions.value.selectedBatches.includes(batch.id))
    }

    const exportReport = async () => {
      const filteredBatches = getFilteredBatches()

      if (filteredBatches.length === 0) {
        alert('No hay lotes seleccionados para exportar.')
        return
      }


      alert(`Generando ${exportOptions.value.formats.excel && exportOptions.value.formats.pdf ? 'Excel y PDF' : exportOptions.value.formats.excel ? 'Excel' : 'PDF'}...\n\nSe abrirá el diálogo de guardado para cada archivo.`)

      const exportPromises = []

      if (exportOptions.value.formats.excel) {
        exportPromises.push(exportToExcel(filteredBatches))
      }

      if (exportOptions.value.formats.pdf) {
        exportPromises.push(exportToPDF(filteredBatches))
      }

      try {
        await Promise.all(exportPromises)
      } catch (error) {
        console.error('Error en la exportación:', error)
        alert('Error durante la exportación. Revisa la consola para más detalles.')
      }
    }

    const formatDate = (date) => {
      return new Date(date).toLocaleDateString()
    }

    // Watchers para filtros automáticos
    watch(() => filters.value.startDate, () => loadReport())
    watch(() => filters.value.endDate, () => loadReport())
    watch(() => filters.value.batch, () => loadReport())

    onMounted(() => {
      loadReport()
    })

    return {
      loading,
      data,
      summary,
      expandedBatches,
      expandedSales,
      filters,
      exportOptions,
      canExport,
      batchHeaders,
      saleHeaders,
      productHeaders,
      loadReport,
      loadAllReport,
      exportToExcel,
      exportToPDF,
      exportReport,
      formatCurrency,
      formatDate,
      getBatchRowClass,
      getSaleRowClass,
      getTotalProductUnits,
      onExportAllChange,
      getFilteredBatches
    }
  }
}