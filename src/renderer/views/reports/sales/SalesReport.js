import { ref, computed, onMounted, watch } from 'vue'
import { useReportsStore } from '@/stores/reports'
import { formatCurrency } from '@/utils/formatters'
import ExcelJS from 'exceljs'
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

      const workbook = new ExcelJS.Workbook()
      const worksheet = workbook.addWorksheet('Reporte Completo')

      worksheet.columns = [
        { width: 20 },
        { width: 30 },
        { width: 15 },
        { width: 20 },
        { width: 12 },
        { width: 12 },
        { width: 12 }
      ]

      let currentRow = 1

      const titleRow = worksheet.addRow(['', 'REPORTE DE VENTAS POR LOTES - DETALLADO'])
      titleRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1976D2' } }
      titleRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 14 }
      
      currentRow++

      worksheet.addRow(['', 'Sistema de Facturación'])
      currentRow++

      worksheet.addRow(['', 'Fecha de generación:', new Date().toLocaleDateString()])
      currentRow++

      worksheet.addRow([])
      currentRow++

      batches.forEach((batch, batchIndex) => {
        const batchLote = batch.lote || 'N/A'
        const batchOpeningDate = batch.openingDate ? new Date(batch.openingDate).toLocaleDateString() : 'N/A'
        const batchClosingDate = batch.closingDate ? new Date(batch.closingDate).toLocaleDateString() : 'En curso'

        const totalUsdForBatch = (batch.sales || []).reduce((sum, sale) => {
          return sum + ((sale.totalBs && sale.dolarRateAtSale) ? (sale.totalBs / sale.dolarRateAtSale) : 0)
        }, 0)

        const batchInfoRow = worksheet.addRow(['', 'INFORMACIÓN DEL LOTE: ' + batchLote])
        batchInfoRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF388E3C' } }
        batchInfoRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 }
        
        currentRow++

        worksheet.addRow(['', 'Lote', batchLote])
        currentRow++

        worksheet.addRow(['', 'Fecha Apertura', batchOpeningDate])
        currentRow++

        worksheet.addRow(['', 'Fecha Cierre', batchClosingDate])
        currentRow++

        worksheet.addRow(['', 'Total Ventas', batch.summary?.totalSales || 0])
        currentRow++

        worksheet.addRow(['', 'Total BS', batch.summary?.totalAmountBs || 0])
        currentRow++

        worksheet.addRow(['', 'Vendido BS', batch.summary?.totalSoldBs || 0])
        currentRow++

        worksheet.addRow(['', 'Total USD', formatCurrency(totalUsdForBatch, 'USD')])
        currentRow++

        worksheet.addRow(['', 'Cambio BS', batch.summary?.totalChangeGivenBs || 0])
        currentRow++

        worksheet.addRow([]) 
        currentRow++

        if (batch.sales && Array.isArray(batch.sales) && batch.sales.length > 0) {
          batch.sales.forEach((sale, saleIndex) => {
            
            worksheet.addRow(['', '----------------------------------- INICIO DE VENTA -------------------------------'])
            worksheet.addRow([])

            const saleRow = worksheet.addRow(['','VENTA: ' + (sale.saleNumber || 'N/A')])
            saleRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFEB3B' } }
            saleRow.font = { bold: true, color: { argb: 'FF000000' }, size: 12 }
            
            currentRow++

            worksheet.addRow([]) 
            currentRow++

            worksheet.addRow(['', 'Fecha:', sale.saleDate ? new Date(sale.saleDate).toLocaleDateString() : 'N/A'])
            currentRow++

            worksheet.addRow(['', 'Usuario:', sale.userName || 'Usuario Desconocido'])
            currentRow++

            worksheet.addRow(['', 'Total BS:', sale.totalBs || 0])
            currentRow++

            worksheet.addRow(['', 'Vendido BS:', sale.totalSoldBs || 0])
            currentRow++

            const totalUsdForSale = (sale.totalBs && sale.dolarRateAtSale) ? sale.totalBs / sale.dolarRateAtSale : 0
            worksheet.addRow(['', 'Total USD:', formatCurrency(totalUsdForSale, 'USD')])
            currentRow++

            worksheet.addRow(['', 'Cambio BS:', sale.changeGivenBs || 0])
            currentRow++

            worksheet.addRow([])
            currentRow++

            const productsRow = worksheet.addRow(['', 'PRODUCTOS VENDIDOS'])
            productsRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFBBDEFB' } }
            productsRow.font = { bold: true, color: { argb: 'FF000000' }, size: 11 }
            productsRow.alignment = { horizontal: 'center' }
            currentRow++

            const productsHeaderRow = worksheet.addRow(['', 'Nombre', 'Código', 'Cantidad', 'Precio Unitario BS', 'Subtotal BS'])
            productsHeaderRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE3F2FD' } }
            productsHeaderRow.font = { bold: true }
            currentRow++

            if (sale.items && Array.isArray(sale.items) && sale.items.length > 0) {
              sale.items.forEach(item => {
                worksheet.addRow([
                  '',
                  item.productName || item.name || 'Producto Desconocido',
                  item.productCode || item.internalCode || 'N/A',
                  item.quantity || 0,
                  item.unitPriceBs || 0,
                  item.subtotalBs || 0
                ])
                currentRow++
              })
            } else {
              worksheet.addRow(['', 'No hay productos registrados', '', '', '', ''])
              currentRow++
            }

            worksheet.addRow([])
            currentRow++

            const paymentsRow = worksheet.addRow(['', 'MÉTODOS DE PAGO'])
            paymentsRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC8E6C9' } }
            paymentsRow.font = { bold: true, color: { argb: 'FF000000' }, size: 11 }
            paymentsRow.alignment = { horizontal: 'center' }
            currentRow++

            const paymentsHeaderRow = worksheet.addRow(['', 'Método', 'Monto BS', 'Referencia'])
            paymentsHeaderRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE3F2FD' } }
            paymentsHeaderRow.font = { bold: true }
            currentRow++

            if (sale.payments && Array.isArray(sale.payments) && sale.payments.length > 0) {
              sale.payments.forEach(payment => {
                worksheet.addRow([
                  '',
                  payment.methodName || payment.name || 'Método Desconocido',
                  payment.amount || 0,
                  payment.reference || ''
                ])
                currentRow++
              })
            } else {
              worksheet.addRow(['', 'No hay métodos de pago registrados', '', ''])
              currentRow++
            }

            worksheet.addRow([])
            currentRow++

            worksheet.addRow(['', '----------------------------------- FIN DE VENTA -------------------------------'])
            worksheet.addRow([])
            currentRow++

            worksheet.addRow([])
            currentRow++
          })
        } else {
          worksheet.addRow(['No hay ventas registradas en este lote'])
          currentRow++

          worksheet.addRow([])
          currentRow++
        }
        
        if (batches.length > 1 && batchIndex < batches.length - 1) {
          worksheet.addRow([])
          worksheet.addRow(['', '================================================================================','================================================================================', 'CAMBIO DE LOTE', '================================================================================ '])
          currentRow++

          worksheet.addRow([])
          currentRow++
        }
      })

      let fileName = 'reporte-completo.xlsx'
      if (batches.length === 1 && batches[0].lote) {
        const loteName = batches[0].lote.replace(/[^a-z0-9]/gi, '_').toLowerCase()
        fileName = `reporte-lote-${loteName}.xlsx`
      }

      const buffer = await workbook.xlsx.writeBuffer()
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      a.click()
      window.URL.revokeObjectURL(url)

    }

    const exportToPDF = async (batchesToExport = null) => {
      const filteredBatches = batchesToExport || getFilteredBatches()
      if (!filteredBatches || filteredBatches.length === 0) {
        alert('No hay lotes seleccionados para exportar.')
        return
      }

      console.log('Iniciando exportación a PDF con', filteredBatches.length, 'lotes')

      const doc = new jsPDF()

      doc.setFontSize(20)
      doc.setTextColor(25, 118, 210)
      doc.text('REPORTE DE VENTAS POR LOTES', 14, 30)
      doc.setTextColor(0, 0, 0)

      doc.setFontSize(14)
      doc.text('Sistema de Facturación', 14, 45)

      doc.setFontSize(10)
      doc.text(`Fecha de generación: ${new Date().toLocaleDateString()}`, 14, 55)

      doc.setFontSize(16)
      doc.setTextColor(25, 118, 210)
      doc.text('RESUMEN DETALLADO POR LOTES', 14, 70)
      doc.setTextColor(0, 0, 0)

      const batchHeaders = ['Lote', 'Fecha Apertura', 'Fecha Cierre', 'Estado', 'Ventas', 'Total BS', 'Vendido BS', 'Cambio BS']
      const batchData = filteredBatches.map(batch => [
        batch.lote || 'N/A',
        batch.openingDate ? new Date(batch.openingDate).toLocaleDateString() : 'N/A',
        batch.closingDate ? new Date(batch.closingDate).toLocaleDateString() : 'N/A',
        batch.closingDate ? 'Cerrado' : 'Abierto',
        batch.summary?.totalSales || 0,
        formatCurrency(batch.summary?.totalAmountBs || 0),
        formatCurrency(batch.summary?.totalSoldBs || 0),
        formatCurrency(batch.summary?.totalChangeGivenBs || 0)
      ])

      autoTable(doc, {
        head: [batchHeaders],
        body: batchData,
        startY: 80,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [25, 118, 210] },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        margin: { left: 14, right: 14 }
      })

      filteredBatches.forEach((batch, batchIndex) => {
        doc.addPage()

        doc.setFontSize(16)
        doc.setTextColor(56, 142, 60)
        doc.text(`INFORMACIÓN DEL LOTE: ${batch.lote || 'N/A'}`, 14, 20)
        doc.setTextColor(0, 0, 0)
        let yPosition = 30

        doc.setFontSize(10)
        doc.text(`Lote: ${batch.lote || 'N/A'}`, 14, yPosition)
        yPosition += 7
        doc.text(`Fecha Apertura: ${batch.openingDate ? new Date(batch.openingDate).toLocaleDateString() : 'N/A'}`, 14, yPosition)
        yPosition += 7
        doc.text(`Fecha Cierre: ${batch.closingDate ? new Date(batch.closingDate).toLocaleDateString() : 'En curso'}`, 14, yPosition)
        yPosition += 7
        doc.text(`Total Ventas: ${batch.summary?.totalSales || 0}`, 14, yPosition)
        yPosition += 7
        doc.text(`Total BS: ${formatCurrency(batch.summary?.totalAmountBs || 0)} Bs`, 14, yPosition)
        yPosition += 7
        doc.text(`Vendido BS: ${formatCurrency(batch.summary?.totalSoldBs || 0)} Bs`, 14, yPosition)
        yPosition += 7
        doc.text(`Cambio BS: ${formatCurrency(batch.summary?.totalChangeGivenBs || 0)} Bs`, 14, yPosition)
        yPosition += 7
        const totalUsdForBatch = (batch.sales || []).reduce((sum, sale) => {
          return sum + ((sale.totalBs && sale.dolarRateAtSale) ? (sale.totalBs / sale.dolarRateAtSale) : 0)
        }, 0)
        doc.text(`Total USD: ${formatCurrency(totalUsdForBatch, 'USD')}`, 14, yPosition)
        yPosition += 15

        if (!batch.sales || batch.sales.length === 0) {
          doc.setFontSize(12)
          doc.setTextColor(244, 67, 54)
          doc.text('No hay ventas registradas en este lote', 14, yPosition)
          doc.setTextColor(0, 0, 0)
          yPosition += 10
        } else {
          batch.sales.forEach((sale, saleIndex) => {
            doc.addPage()
            let yPosition = 20

            doc.setFontSize(14)
            doc.text(`VENTA: ${sale.saleNumber || 'N/A'}`, 14, yPosition)
            doc.setTextColor(0, 0, 0)
            yPosition += 8

            doc.setFontSize(10)
            doc.text(`Fecha: ${sale.saleDate ? new Date(sale.saleDate).toLocaleDateString() : 'N/A'}`, 14, yPosition)
            yPosition += 7
            doc.text(`Usuario: ${sale.userName || 'Usuario Desconocido'}`, 14, yPosition)
            yPosition += 7
            doc.text(`Total BS: ${formatCurrency(sale.totalBs || 0)} Bs`, 14, yPosition)
            yPosition += 7
            doc.text(`Vendido BS: ${formatCurrency(sale.totalSoldBs || 0)} Bs`, 14, yPosition)
            yPosition += 7
            const totalUsdForSale = (sale.totalBs && sale.dolarRateAtSale) ? sale.totalBs / sale.dolarRateAtSale : 0
            doc.text(`Total USD: ${formatCurrency(totalUsdForSale, 'USD')}`, 14, yPosition)
            yPosition += 7
            doc.text(`Cambio BS: ${formatCurrency(sale.changeGivenBs || 0)} Bs`, 14, yPosition)
            yPosition += 10

            if (sale.items && sale.items.length > 0) {
              doc.setFontSize(11)
              doc.setTextColor(25, 118, 210)
              doc.text('PRODUCTOS VENDIDOS', 14, yPosition)
              doc.setTextColor(0, 0, 0)
              yPosition += 5

              const productTableHeaders = [['Nombre', 'Código', 'Cantidad', 'Precio Unitario BS', 'Subtotal BS']]
              const productTableData = sale.items.map(item => [
                item.productName || item.name || 'Producto Desconocido',
                item.productCode || item.internalCode || 'N/A',
                item.quantity || 0,
                formatCurrency(item.unitPriceBs || 0),
                formatCurrency(item.subtotalBs || 0)
              ])

              autoTable(doc, {
                head: productTableHeaders,
                body: productTableData,
                startY: yPosition,
                styles: { fontSize: 8, cellPadding: 2 },
                headStyles: { fillColor: [187, 222, 251], textColor: [0, 0, 0], fontStyle: 'bold' },
                alternateRowStyles: { fillColor: [245, 245, 245] },
                margin: { left: 14, right: 14 },
                didDrawPage: (data) => {
                  yPosition = data.cursor.y
                }
              })
              yPosition = doc.lastAutoTable.finalY + 10
            } else {
              doc.setFontSize(10)
              doc.setTextColor(150, 150, 150)
              doc.text('No hay productos registrados para esta venta.', 14, yPosition)
              doc.setTextColor(0, 0, 0)
              yPosition += 10
            }

            if (sale.payments && sale.payments.length > 0) {
              doc.setFontSize(11)
              doc.setTextColor(76, 175, 80)
              doc.text('MÉTODOS DE PAGO', 14, yPosition)
              doc.setTextColor(0, 0, 0)
              yPosition += 5

              const paymentTableHeaders = [['Método', 'Monto BS', 'Referencia']]
              const paymentTableData = sale.payments.map(payment => [
                payment.methodName || payment.name || 'Método Desconocido',
                formatCurrency(payment.amount || 0),
                payment.reference || ''
              ])

              autoTable(doc, {
                head: paymentTableHeaders,
                body: paymentTableData,
                startY: yPosition,
                styles: { fontSize: 8, cellPadding: 2 },
                headStyles: { fillColor: [200, 230, 201], textColor: [0, 0, 0], fontStyle: 'bold' },
                alternateRowStyles: { fillColor: [245, 245, 245] },
                margin: { left: 14, right: 14 },
                didDrawPage: (data) => {
                  yPosition = data.cursor.y
                }
              })
              yPosition = doc.lastAutoTable.finalY + 10
            } else {
              doc.setFontSize(10)
              doc.setTextColor(150, 150, 150)
              doc.text('No hay métodos de pago registrados para esta venta.', 14, yPosition)
              doc.setTextColor(0, 0, 0)
              yPosition += 10
            }
          })
        }

      })

      let fileName = 'reporte-completo.pdf'
      if (filteredBatches.length === 1 && filteredBatches[0].lote) {
        const loteName = filteredBatches[0].lote.replace(/[^a-z0-9]/gi, '_').toLowerCase()
        fileName = `reporte-lote-${loteName}.pdf`
      }

      doc.save(fileName)
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

    watch(() => filters.value.startDate, () => loadReport())
    watch(() => filters.value.endDate, () => loadReport())
    watch(() => filters.value.batch, () => loadReport())

    onMounted(() => {
      loadAllReport()
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