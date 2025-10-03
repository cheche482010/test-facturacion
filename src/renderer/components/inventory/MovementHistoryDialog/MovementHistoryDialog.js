import { ref, computed, watch, onMounted } from 'vue'
import { useInventoryStore } from '../../../stores/inventory'

export default {
  props: {
    modelValue: Boolean,
    product: Object
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const inventoryStore = useInventoryStore()

    const selectedMovementType = ref(null)
    const startDate = ref('')
    const endDate = ref('')

    const movementTypeOptions = [
      { title: 'Entradas', value: 'entrada' },
      { title: 'Salidas', value: 'salida' },
      { title: 'Ajustes', value: 'ajuste' },
      { title: 'Devoluciones', value: 'devolucion' }
    ]

    const dialog = computed({
      get: () => props.modelValue,
      set: (value) => emit('update:modelValue', value)
    })

    const movements = computed(() => {
      if (!props.product) return []
      return inventoryStore.getMovementsByProduct(props.product.id)
    })

    const filteredMovements = computed(() => {
      let filtered = movements.value

      if (selectedMovementType.value) {
        filtered = filtered.filter(m => m.movementType === selectedMovementType.value)
      }

      if (startDate.value) {
        filtered = filtered.filter(m => new Date(m.movementDate) >= new Date(startDate.value))
      }

      if (endDate.value) {
        filtered = filtered.filter(m => new Date(m.movementDate) <= new Date(endDate.value))
      }

      return filtered.sort((a, b) => new Date(b.movementDate) - new Date(a.movementDate))
    })

    const getMovementColor = (type) => {
      switch (type) {
        case 'entrada': return 'success'
        case 'salida': return 'error'
        case 'ajuste': return 'warning'
        case 'devolucion': return 'info'
        default: return 'grey'
      }
    }

    const getMovementIcon = (type) => {
      switch (type) {
        case 'entrada': return 'mdi-arrow-up'
        case 'salida': return 'mdi-arrow-down'
        case 'ajuste': return 'mdi-pencil'
        case 'devolucion': return 'mdi-undo'
        default: return 'mdi-swap-horizontal'
      }
    }

    const getMovementTypeText = (type) => {
      switch (type) {
        case 'entrada': return 'Entrada'
        case 'salida': return 'Salida'
        case 'ajuste': return 'Ajuste'
        case 'devolucion': return 'Devolución'
        default: return type
      }
    }

    const getReasonText = (reason) => {
      const reasons = {
        'compra': 'Compra',
        'venta': 'Venta',
        'ajuste_inventario': 'Ajuste de inventario',
        'devolucion_cliente': 'Devolución de cliente',
        'devolucion_proveedor': 'Devolución a proveedor',
        'merma': 'Merma',
        'robo': 'Robo/Pérdida',
        'inventario_inicial': 'Inventario inicial',
        'inventario_fisico': 'Inventario físico',
        'producto_danado': 'Producto dañado',
        'producto_vencido': 'Producto vencido'
      }
      return reasons[reason] || reason
    }

    const formatDate = (date) => {
      return new Date(date).toLocaleString('es-VE')
    }

    const exportMovements = () => {
      const csvContent = filteredMovements.value.map(m => 
        `${formatDate(m.movementDate)},${getMovementTypeText(m.movementType)},${m.quantity},${m.previousStock},${m.newStock},${getReasonText(m.reason)}`
      ).join('\n')
      
      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `movimientos_${props.product.name}_${new Date().toISOString().split('T')[0]}.csv`
      a.click()
    }

    const closeDialog = () => {
      emit('update:modelValue', false)
    }

    watch(() => props.product, async (newProduct) => {
      if (newProduct) {
        await inventoryStore.fetchMovementsByProduct(newProduct.id)
      }
    })

    onMounted(() => {
      const today = new Date()
      const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate())
      
      endDate.value = today.toISOString().split('T')[0]
      startDate.value = lastMonth.toISOString().split('T')[0]
    })

    return {
      selectedMovementType,
      startDate,
      endDate,
      movementTypeOptions,
      dialog,
      movements,
      filteredMovements,
      getMovementColor,
      getMovementIcon,
      getMovementTypeText,
      getReasonText,
      formatDate,
      exportMovements,
      closeDialog
    }
  }
}