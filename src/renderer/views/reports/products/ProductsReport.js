import { ref, computed, onMounted } from 'vue'
import { useReportsStore } from '@/stores/reports'
import { useCategoryStore } from '@/stores/categories'
import { formatCurrency } from '@/utils/formatters'
import * as XLSX from 'xlsx'
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
    const reportsStore = useReportsStore()
    const categoryStore = useCategoryStore()
    const loading = ref(false)
    const data = ref([])

    // Filtros locales
    const filters = ref({
      complete: 'true',
      category: null,
      status: 'all',
      stockFilter: 'all'
    })

    // Opciones para filtros
    const completeOptions = [
      { title: 'Completo', value: 'true' },
      { title: 'Detallado', value: 'false' }
    ]

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

    // Headers de la tabla
    const headers = [
      { title: 'Código Interno', key: 'internalCode' },
      { title: 'Producto', key: 'name' },
      { title: 'Estado', key: 'status', align: 'center' },
      { title: 'Stock', key: 'currentStock', align: 'center' },
      { title: 'Precio Venta USD', key: 'retailPriceUsd', align: 'end' },
      { title: 'Valor Total USD', key: 'totalValueUsd', align: 'end' },
      { title: 'Precio Venta BS', key: 'retailPriceBs', align: 'end' },
      { title: 'Valor Total BS', key: 'totalValueBs', align: 'end' }
    ]

    // Funciones helper
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
      if (filters.value.category) activeFilters.push(`Categoría: ${filters.value.category}`)
      if (filters.value.status !== 'all') activeFilters.push(`Estado: ${filters.value.status}`)
      if (filters.value.stockFilter !== 'all') activeFilters.push(`Stock: ${filters.value.stockFilter}`)
      return activeFilters.length > 0 ? activeFilters.join(', ') : 'Ninguno'
    }

    // Métodos
    const loadReport = async () => {
      loading.value = true
      try {
        // Temporalmente quitar el filtro de precio para mostrar todos los productos
        const params = { ...filters.value, showAll: 'true' }
        const result = await reportsStore.fetchProductInventoryReport(params)
        data.value = result.products
      } catch (error) {
        console.error('Error loading products report:', error)
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
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Productos')
      XLSX.writeFile(workbook, 'reporte-productos-inventario.xlsx')
    }

    const exportToPDF = () => {
      if (data.value.length === 0) return
      const doc = new jsPDF()

      doc.setFontSize(16)
      doc.text('Reporte de Inventario por Productos', 14, 20)

      doc.setFontSize(10)
      doc.text(`Fecha de generación: ${new Date().toLocaleDateString()}`, 14, 30)
      doc.text(`Tasa USD actual: ${formatCurrency(props.currentDolarRate)} Bs/USD`, 14, 35)
      doc.text(`Filtros: ${getActiveFiltersText()}`, 14, 40)

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
        startY: 50,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [41, 128, 185] }
      })

      doc.save('reporte-productos-inventario.pdf')
    }

    // Lifecycle
    onMounted(async () => {
      await categoryStore.fetchCategories()
      loadReport()
    })

    return {
      loading,
      data,
      filters,
      completeOptions,
      statusOptions,
      stockFilterOptions,
      categoryOptions,
      headers,
      loadReport,
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