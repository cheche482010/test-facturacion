<template>
  <v-dialog v-model="dialog" max-width="900px">
    <v-card>
      <v-card-title>
        <span class="text-h5">Historial de Movimientos</span>
        <v-spacer />
        <v-btn
          icon="mdi-close"
          variant="text"
          @click="closeDialog"
        />
      </v-card-title>

      <v-card-text>
        <div v-if="product" class="mb-4">
          <v-card variant="outlined">
            <v-card-text>
              <div class="d-flex align-center">
                <v-avatar size="40" class="mr-3">
                  <v-img
                    v-if="product.image"
                    :src="product.image"
                    alt="Producto"
                  />
                  <v-icon v-else>mdi-package-variant</v-icon>
                </v-avatar>
                <div>
                  <div class="font-weight-medium">{{ product.name }}</div>
                  <div class="text-caption">{{ product.internalCode }}</div>
                </div>
                <v-spacer />
                <div class="text-right">
                  <div class="text-h6">{{ product.currentStock }} {{ product.unit }}</div>
                  <div class="text-caption">Stock actual</div>
                </div>
              </div>
            </v-card-text>
          </v-card>
        </div>

        <!-- Filtros -->
        <v-row class="mb-4">
          <v-col cols="12" md="4">
            <v-select
              v-model="selectedMovementType"
              :items="movementTypeOptions"
              label="Tipo de Movimiento"
              variant="outlined"
              density="compact"
              clearable
            />
          </v-col>
          <v-col cols="12" md="4">
            <v-text-field
              v-model="startDate"
              label="Fecha Desde"
              variant="outlined"
              density="compact"
              type="date"
            />
          </v-col>
          <v-col cols="12" md="4">
            <v-text-field
              v-model="endDate"
              label="Fecha Hasta"
              variant="outlined"
              density="compact"
              type="date"
            />
          </v-col>
        </v-row>

        <!-- Timeline de movimientos -->
        <v-timeline
          v-if="filteredMovements.length > 0"
          density="compact"
          class="mb-4"
        >
          <v-timeline-item
            v-for="movement in filteredMovements"
            :key="movement.id"
            :dot-color="getMovementColor(movement.movementType)"
            size="small"
          >
            <template v-slot:icon>
              <v-icon size="16">{{ getMovementIcon(movement.movementType) }}</v-icon>
            </template>

            <v-card variant="outlined" class="mb-2">
              <v-card-text class="py-2">
                <div class="d-flex justify-space-between align-center">
                  <div>
                    <div class="font-weight-medium">
                      {{ getMovementTypeText(movement.movementType) }}
                    </div>
                    <div class="text-caption text-medium-emphasis">
                      {{ getReasonText(movement.reason) }}
                    </div>
                  </div>
                  <div class="text-right">
                    <v-chip
                      :color="getMovementColor(movement.movementType)"
                      size="small"
                      variant="tonal"
                    >
                      {{ movement.movementType === 'entrada' ? '+' : '-' }}{{ movement.quantity }} {{ product.unit }}
                    </v-chip>
                    <div class="text-caption mt-1">
                      {{ formatDate(movement.movementDate) }}
                    </div>
                  </div>
                </div>

                <div class="d-flex justify-space-between align-center mt-2">
                  <div class="text-caption">
                    Stock: {{ movement.previousStock }} → {{ movement.newStock }}
                  </div>
                  <div class="text-caption">
                    {{ movement.user?.firstName }} {{ movement.user?.lastName }}
                  </div>
                </div>

                <div v-if="movement.notes" class="text-caption mt-1 text-medium-emphasis">
                  {{ movement.notes }}
                </div>
              </v-card-text>
            </v-card>
          </v-timeline-item>
        </v-timeline>

        <v-alert
          v-else
          type="info"
          variant="tonal"
        >
          No se encontraron movimientos para los filtros seleccionados.
        </v-alert>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn @click="exportMovements" prepend-icon="mdi-download">
          Exportar
        </v-btn>
        <v-btn color="primary" @click="closeDialog">
          Cerrar
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useInventoryStore } from '../../stores/inventory'

const props = defineProps({
  modelValue: Boolean,
  product: Object
})

const emit = defineEmits(['update:modelValue'])

const inventoryStore = useInventoryStore()

// Estado reactivo
const selectedMovementType = ref(null)
const startDate = ref('')
const endDate = ref('')

// Opciones
const movementTypeOptions = [
  { title: 'Entradas', value: 'entrada' },
  { title: 'Salidas', value: 'salida' },
  { title: 'Ajustes', value: 'ajuste' },
  { title: 'Devoluciones', value: 'devolucion' }
]

// Computed properties
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

// Métodos
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
  // Implementar exportación a CSV/Excel
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

// Watchers
watch(() => props.product, async (newProduct) => {
  if (newProduct) {
    await inventoryStore.fetchMovementsByProduct(newProduct.id)
  }
})

// Lifecycle
onMounted(() => {
  // Establecer fechas por defecto (último mes)
  const today = new Date()
  const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate())
  
  endDate.value = today.toISOString().split('T')[0]
  startDate.value = lastMonth.toISOString().split('T')[0]
})
</script>
