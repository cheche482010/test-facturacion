<template>
  <v-dialog v-model="dialog" max-width="600px" persistent>
    <v-card>
      <v-card-title>
        <span class="text-h5">Nuevo Movimiento de Inventario</span>
      </v-card-title>

      <v-card-text>
        <v-form ref="form" v-model="valid">
          <v-row>
            <v-col cols="12">
              <v-autocomplete
                v-model="formData.productId"
                :items="products"
                item-title="name"
                item-value="id"
                label="Producto *"
                :rules="[rules.required]"
                variant="outlined"
                density="compact"
                prepend-inner-icon="mdi-magnify"
              >
                <template v-slot:item="{ props, item }">
                  <v-list-item
                    v-bind="props"
                    :subtitle="`Stock: ${item.raw.currentStock} ${item.raw.unit}`"
                  />
                </template>
              </v-autocomplete>
            </v-col>

            <v-col cols="12" md="6">
              <v-select
                v-model="formData.movementType"
                :items="movementTypeOptions"
                label="Tipo de Movimiento *"
                :rules="[rules.required]"
                variant="outlined"
                density="compact"
              />
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field
                v-model.number="formData.quantity"
                label="Cantidad *"
                :rules="[rules.required, rules.positive]"
                variant="outlined"
                density="compact"
                type="number"
                :suffix="selectedProductUnit"
              />
            </v-col>

            <v-col cols="12">
              <v-select
                v-model="formData.reason"
                :items="reasonOptions"
                label="Motivo *"
                :rules="[rules.required]"
                variant="outlined"
                density="compact"
              />
            </v-col>

            <v-col cols="12">
              <v-textarea
                v-model="formData.notes"
                label="Notas"
                variant="outlined"
                density="compact"
                rows="2"
              />
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn @click="closeDialog">Cancelar</v-btn>
        <v-btn
          color="primary"
          :disabled="!valid"
          :loading="saving"
          @click="saveMovement"
        >
          Guardar Movimiento
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useInventoryStore } from '../../stores/inventory'
import { useProductStore } from '../../stores/products'

const props = defineProps({
  modelValue: Boolean
})

const emit = defineEmits(['update:modelValue', 'saved'])

const inventoryStore = useInventoryStore()
const productStore = useProductStore()

// Estado reactivo
const valid = ref(false)
const saving = ref(false)
const form = ref(null)

const initialFormData = {
  productId: null,
  movementType: 'entrada',
  quantity: 0,
  reason: '',
  notes: ''
}

const formData = ref({ ...initialFormData })

// Opciones
const movementTypeOptions = [
  { title: 'Entrada', value: 'entrada' },
  { title: 'Salida', value: 'salida' }
]

const reasonOptions = [
  { title: 'Compra a proveedor', value: 'compra' },
  { title: 'Venta a cliente', value: 'venta' },
  { title: 'Devolución de cliente', value: 'devolucion_cliente' },
  { title: 'Devolución a proveedor', value: 'devolucion_proveedor' },
  { title: 'Consumo interno', value: 'consumo_interno' },
  { title: 'Transferencia', value: 'transferencia' }
]

// Reglas de validación
const rules = {
  required: value => !!value || 'Este campo es requerido',
  positive: value => value > 0 || 'Debe ser un número positivo'
}

// Computed properties
const dialog = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const products = computed(() => productStore.products)

const selectedProductUnit = computed(() => {
  const product = products.value.find(p => p.id === formData.value.productId)
  return product?.unit || 'unidades'
})

// Métodos
const saveMovement = async () => {
  const { valid } = await form.value.validate()
  if (!valid) return

  saving.value = true
  try {
    await inventoryStore.createMovement(formData.value)
    emit('saved')
    closeDialog()
  } catch (error) {
    console.error('Error guardando movimiento:', error)
    // Aquí podrías mostrar una notificación de error al usuario
  } finally {
    saving.value = false
  }
}

const closeDialog = () => {
  dialog.value = false
}

const resetForm = () => {
  formData.value = { ...initialFormData }
  form.value?.resetValidation()
}

watch(dialog, (newValue) => {
  if (!newValue) {
    resetForm()
  }
})
</script>