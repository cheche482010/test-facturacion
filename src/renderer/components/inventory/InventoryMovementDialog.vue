<template>
  <v-dialog v-model="dialog" max-width="800px" persistent>
    <v-card>
      <v-card-title>
        <span class="text-h5">Nuevo Movimiento de Inventario</span>
      </v-card-title>

      <v-card-text>
        <v-form ref="form" v-model="valid">
          <v-row>
            <!-- Product selection -->
            <v-col cols="12">
              <v-autocomplete
                v-model="selectedProduct"
                :items="products"
                item-title="name"
                item-value="id"
                label="Buscar Producto *"
                :rules="[rules.required]"
                variant="outlined"
                density="compact"
                return-object
                clearable
              >
                <template #item="{ props, item }">
                  <v-list-item v-bind="props" :title="item.raw.name">
                    <template #subtitle>
                      <span>{{ item.raw.internalCode }} - Stock: {{ item.raw.currentStock }}</span>
                    </template>
                  </v-list-item>
                </template>
              </v-autocomplete>
            </v-col>

            <!-- Movement details -->
            <v-col cols="12" md="6">
              <v-select
                v-model="formData.movementType"
                :items="movementTypes"
                label="Tipo de Movimiento *"
                :rules="[rules.required]"
                variant="outlined"
                density="compact"
              />
            </v-col>

            <v-col cols="12" md="6">
              <v-select
                v-model="formData.reason"
                :items="reasonOptions"
                label="Motivo *"
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
                :suffix="selectedProduct ? selectedProduct.unit : ''"
              />
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field
                v-model.number="formData.unitCost"
                label="Costo Unitario"
                variant="outlined"
                density="compact"
                type="number"
                prefix="$"
                :disabled="formData.movementType === 'salida'"
              />
            </v-col>

            <v-col cols="12">
              <v-textarea
                v-model="formData.notes"
                label="Notas Adicionales"
                variant="outlined"
                density="compact"
                rows="3"
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
const selectedProduct = ref(null)

// Opciones
const movementTypes = [
  { title: 'Entrada', value: 'entrada' },
  { title: 'Salida', value: 'salida' },
  { title: 'Ajuste', value: 'ajuste' },
  { title: 'Devolución', value: 'devolucion' }
]

const reasonOptions = [
  { title: 'Compra a proveedor', value: 'compra' },
  { title: 'Venta a cliente', value: 'venta' },
  { title: 'Ajuste de inventario', value: 'ajuste_inventario' },
  { title: 'Devolución de cliente', value: 'devolucion_cliente' },
  { title: 'Devolución a proveedor', value: 'devolucion_proveedor' },
  { title: 'Pérdida/Daño', value: 'merma' },
  { title: 'Otro', value: 'otro' }
]

// Reglas de validación
const rules = {
  required: value => !!value || 'Este campo es requerido',
  positive: value => value > 0 || 'Debe ser un número positivo'
}

// Datos del formulario
const formData = ref({
  productId: null,
  movementType: 'entrada',
  reason: 'compra',
  quantity: 0,
  unitCost: 0,
  notes: ''
})

// Computed properties
const dialog = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const products = computed(() => productStore.products)

// Métodos
const resetForm = () => {
  selectedProduct.value = null
  formData.value = {
    productId: null,
    movementType: 'entrada',
    reason: 'compra',
    quantity: 0,
    unitCost: 0,
    notes: ''
  }
  form.value?.resetValidation()
}

const saveMovement = async () => {
  if (!form.value.validate()) return

  saving.value = true
  try {
    await inventoryStore.createMovement({
      ...formData.value,
      productId: selectedProduct.value.id
    })
    emit('saved')
    closeDialog()
  } catch (error) {
    console.error('Error guardando movimiento:', error)
  } finally {
    saving.value = false
  }
}

const closeDialog = () => {
  resetForm()
  dialog.value = false
}

// Watchers
watch(selectedProduct, (newProduct) => {
  if (newProduct) {
    formData.value.unitCost = newProduct.costPrice
  }
})

watch(dialog, (isOpen) => {
  if (isOpen && productStore.products.length === 0) {
    productStore.fetchProducts()
  }
})
</script>
