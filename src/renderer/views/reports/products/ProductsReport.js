import { ref, computed, onMounted } from 'vue'
import { useProductStore } from '@/stores/products'
import { useCategoryStore } from '@/stores/categories'
import { formatCurrency } from '@/utils/formatters'
import ExcelJS from 'exceljs'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export default {
  name: 'ProductsReport',
  props: {
    currentDolarRate: {
      type: Number,
      default: 0
    }
  },
  setup(props) {
    const productStore = useProductStore()
    const categoryStore = useCategoryStore()
    const loading = ref(false)
    const data = ref([])

    const filters = ref({
      category: null,
      status: 'all',
      stockFilter: 'all'
    })

    const exportOptions = ref({
      formats: {
        excel: false,
        pdf: false
      }
    })

    const statusOptions = [
      { title: 'Todos', value: 'all' },
      { title: 'Activo', value: 'activo' },
      { title: 'Descontinuado', value: 'descontinuado' },
      { title: 'Agotado', value: 'agotado' }
    ]

    const stockFilterOptions = [
      { title: 'Todos', value: 'all' },
      { title: 'Stock Bajo', value: 'low' },
      { title: 'Agotado', value: 'out' },
      { title: 'Normal', value: 'normal' },
      { title: 'Sobre Stock', value: 'overstock' }
    ]

    const categoryOptions = computed(() => [
      { title: 'Todas', value: null },
      ...categoryStore.categories.map(cat => ({
        title: cat.name,
        value: cat.id
      }))
    ])

    const filteredData = computed(() => {
      let filtered = data.value

      if (filters.value.category) {
        filtered = filtered.filter(product => product.categoryId === filters.value.category)
      }

      if (filters.value.status !== 'all') {
        filtered = filtered.filter(product => product.status === filters.value.status)
      }

      if (filters.value.stockFilter !== 'all') {
        filtered = filtered.filter(product => {
          const stock = parseInt(product.currentStock) || 0
          switch (filters.value.stockFilter) {
            case 'low':
              return stock > 0 && stock <= 5
            case 'out':
              return stock === 0
            case 'normal':
              return stock > 5 && stock <= 100
            case 'overstock':
              return stock > 100
            default:
              return true
          }
        })
      }

      return filtered
    })

    const headers = [
      { title: 'Código Interno', key: 'internalCode' },
      { title: 'Producto', key: 'name' },
      { title: 'Categoría', key: 'categoryName' },
      { title: 'Estado', key: 'status', align: 'center' },
      { title: 'Stock', key: 'currentStock', align: 'center' },
      { title: 'Precio Venta USD', key: 'retailPriceUsd', align: 'end' },
      { title: 'Valor Total USD', key: 'totalValueUsd', align: 'end' },
      { title: 'Precio Venta BS', key: 'retailPriceBs', align: 'end' },
      { title: 'Valor Total BS', key: 'totalValueBs', align: 'end' }
    ]

    const getStatusColor = (status) => {
      switch (status) {
        case 'activo': return 'success'
        case 'descontinuado': return 'warning'
        case 'agotado': return 'error'
        default: return 'grey'
      }
    }

    const getStatusText = (status) => {
      switch (status) {
        case 'activo': return 'Activo'
        case 'descontinuado': return 'Descontinuado'
        case 'agotado': return 'Agotado'
        default: return status
      }
    }

    const getStockColor = (stock) => {
      const stockNum = parseInt(stock) || 0
      if (stockNum === 0) return 'red'
      if (stockNum <= 5) return 'orange'
      return 'green'
    }

    const getActiveFiltersText = () => {
      const activeFilters = []
      if (filters.value.category) {
        const categoryName = categoryOptions.value.find(cat => cat.value === filters.value.category)?.title
        activeFilters.push(`Categoría: ${categoryName}`)
      }
      if (filters.value.status !== 'all') activeFilters.push(`Estado: ${filters.value.status}`)
      if (filters.value.stockFilter !== 'all') activeFilters.push(`Stock: ${filters.value.stockFilter}`)
      return activeFilters.length > 0 ? activeFilters.join(', ') : 'Ninguno'
    }

    const loadProducts = async () => {
      loading.value = true
      try {
        await productStore.fetchProducts()
        data.value = productStore.products.map(product => ({
          ...product,
          categoryName: product.category?.name || 'Sin Categoría',
          retailPriceUsd: parseFloat(product.costPrice) || 0,
          totalValueUsd: Math.round(((parseFloat(product.costPrice) || 0) * (parseInt(product.currentStock) || 0)) * 100) / 100,
          retailPriceBs: Math.round(((parseFloat(product.costPrice) || 0) * (props.currentDolarRate || 1)) * 100) / 100,
          costPriceBs: Math.round(((parseFloat(product.costPrice) || 0) * (props.currentDolarRate || 1)) * 100) / 100,
          totalValueBs: Math.round((((parseFloat(product.costPrice) || 0) * (parseInt(product.currentStock) || 0)) * (props.currentDolarRate || 1)) * 100) / 100
        }))
      } catch (error) {
        console.error('Error loading products:', error)
      } finally {
        loading.value = false
      }
    }

    const clearFilters = () => {
      filters.value = {
        category: null,
        status: 'all',
        stockFilter: 'all'
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
      const exportData = filteredData.value
      if (exportData.length === 0) return

      const workbook = new ExcelJS.Workbook()
      const worksheet = workbook.addWorksheet('Productos')

      headers.forEach((header, index) => {
        worksheet.getColumn(index + 1).width = index === 1 ? 50 : 20
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

      exportData.forEach(item => {
        const rowData = headers.map(h => {
          const value = item[h.key]
          if (h.key.includes('Bs') || h.key.includes('Usd')) {
            return parseFloat(value) || 0
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
      a.download = 'reporte-productos-inventario.xlsx'
      a.click()
      window.URL.revokeObjectURL(url)
    }

    const exportToPDF = () => {
      const exportData = filteredData.value
      if (exportData.length === 0) return
      const doc = new jsPDF()

      doc.setFontSize(16)
      doc.text('Reporte de Inventario por Productos', 14, 20)

      doc.setFontSize(10)
      doc.text(`Fecha de generación: ${new Date().toLocaleDateString()}`, 14, 30)
      doc.text(`Tasa USD actual: ${formatCurrency(props.currentDolarRate)} Bs/USD`, 14, 35)
      doc.text(`Filtros aplicados: ${getActiveFiltersText()}`, 14, 40)

      const tableData = exportData.map(item =>
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
        startY: 50,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [41, 128, 185] }
      })

      doc.save('reporte-productos-inventario.pdf')
    }

    onMounted(async () => {
      await categoryStore.fetchCategories()
      await loadProducts()
    })

    return {
      loading,
      data,
      filteredData,
      filters,
      statusOptions,
      stockFilterOptions,
      categoryOptions,
      headers,
      exportOptions,
      canExport,
      loadProducts,
      clearFilters,
      exportReport,
      exportToExcel,
      exportToPDF,
      getStatusColor,
      getStatusText,
      getStockColor,
      getActiveFiltersText,
      formatCurrency
    }
  }
}