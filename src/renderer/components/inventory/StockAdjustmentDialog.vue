<template>
  <v-dialog v-model="dialog" max-width="600px" persistent>
    <v-card>
      <v-card-title>
        <span class="text-h5">
          {{ product ? 'Ajustar Stock' : 'Ajuste Masivo de Stock' }}
        </span>
      </v-card-title>

      <v-card-text>
        <v-form ref="form" v-model="valid">
          <div>
            <!-- Ajuste individual -->
            <v-row v-if="product">
              <v-col cols="12">
                <v-card variant="outlined" class="mb-4">
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
                    </div>
                  </v-card-text>
                </v-card>
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  :model-value="product.currentStock"
                  label="Stock Actual"
                  variant="outlined"
                  density="compact"
                  readonly
                  :suffix="product.unit"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model.number="formData.newStock"
                  label="Nuevo Stock *"
                  :rules="[rules.required, rules.positive]"
                  variant="outlined"
                  density="compact"
                  type="number"
                  :suffix="product.unit"
                />
              </v-col>

              <v-col cols="12">
                <v-select
                  v-model="formData.reason"
                  :items="reasonOptions"
                  label="Motivo del Ajuste *"
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

              <v-col cols="12">
                <v-alert
                  :type="adjustmentType"
                  variant="tonal"
                  class="mb-0"
                >
                  <div class="d-flex justify-space-between align-center">
                    <span>
                      {{ adjustmentMessage }}
                    </span>
                    <v-chip
                      :color="adjustmentType"
                      size="small"
                    >
                      {{ adjustmentQuantity > 0 ? '+' : '' }}{{ adjustmentQuantity }} {{ product.unit }}
                    </v-chip>
                  </div>
                </v-alert>
              </v-col>
            </div>

            <div v-else>
              <!-- Ajuste masivo -->
              <v-row>
                <v-col cols="12">
                  <v-select
                    v-model="formData.category"
                    :items="categories"
                    item-title="name"
                    item-value="id"
                    label="Categoría"
                    variant="outlined"
                    density="compact"
                    clearable
                  />
                </v-col>

                <v-col cols="12" md="6">
                  <v-select
                    v-model="formData.adjustmentType"
                    :items="massAdjustmentTypes"
                    label="Tipo de Ajuste *"
                    :rules="[rules.required]"
                    variant="outlined"
                    density="compact"
                  />
                </v-col>

                <v-col cols="12" md="6">
                  <v-text-field
                    v-model.number="formData.adjustmentValue"
                    label="Valor"
                    :rules="[rules.required]"
                    variant="outlined"
                    density="compact"
                    type="number"
                    :suffix="formData.adjustmentType === 'percentage' ? '%' : 'unidades'"
                  />
                </v-col>

                <v-col cols="12">
                  <v-select
                    v-model="formData.reason"
                    :items="reasonOptions"
                    label="Motivo del Ajuste *"
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
            </div>
          </v-form>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn @click="closeDialog">Cancelar</v-btn>
        <v-btn
          color="primary"
          :disabled="!valid"
          :loading="saving"
          @click="saveAdjustment"
        >
          Aplicar Ajuste
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useInventoryStore } from '../../stores/inventory'
import { useCategoryStore } from '../../stores/categories'

const props = defineProps({
  modelValue: Boolean,
  product: Object
})

const emit = defineEmits(['update:modelValue', 'saved'])

const inventoryStore = useInventoryStore()
const categoryStore = useCategoryStore()

// Estado reactivo
const valid = ref(false)
const saving = ref(false)
const form = ref(null)

// Opciones
const reasonOptions = [
  { title: 'Inventario físico', value: 'inventario_fisico' },
  { title: 'Ajuste por diferencia', value: 'ajuste_diferencia' },
  { title: 'Producto dañado', value: 'producto_danado' },
  { title: 'Producto vencido', value: 'producto_vencido' },
  { title: 'Robo/Pérdida', value: 'robo_perdida' },
  { title: 'Error de sistema', value: 'error_sistema' },
  { title: 'Otro', value: 'otro' }
]

const massAdjustmentTypes = [
  { title: 'Cantidad fija', value: 'fixed' },
  { title: 'Porcentaje', value: 'percentage' },
  { title: 'Establecer a cero', value: 'zero' }
]

// Reglas de validación
const rules = {
  required: value => !!value || 'Este campo es requerido',
  positive: value => value >= 0 || 'Debe ser mayor o igual a 0'
}

// Datos del formulario
const formData = ref({
  newStock: 0,
  reason: '',
  notes: '',
  category: null,
  adjustmentType: 'fixed',
  adjustmentValue: 0
})

// Computed properties
const dialog = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const categories = computed(() => categoryStore.categories)

const adjustmentQuantity = computed(() => {
  if (!props.product) return 0
  return formData.value.newStock - props.product.currentStock
})

const adjustmentType = computed(() => {
  const qty = adjustmentQuantity.value
  if (qty > 0) return 'success'
  if (qty < 0) return 'warning'
  return 'info'
})

const adjustmentMessage = computed(() => {
  const qty = adjustmentQuantity.value
  if (qty > 0) return 'Entrada de inventario'
  if (qty < 0) return 'Salida de inventario'
  return 'Sin cambios'
})

// Watchers
watch(() => props.product, (newProduct) => {
  if (newProduct) {
    formData.value.newStock = newProduct.currentStock
  }
  resetForm()
}, { immediate: true })

// Métodos
const saveAdjustment = async () => {
  if (!form.value.validate()) return

  saving.value = true
  try {
    if (props.product) {
      // Ajuste individual
      await inventoryStore.adjustStock(
        props.product.id,
        formData.value.newStock,
        formData.value.reason,
        formData.value.notes
      )
    } else {
      // Ajuste masivo
      await inventoryStore.massAdjustment({
        category: formData.value.category,
        adjustmentType: formData.value.adjustmentType,
        adjustmentValue: formData.value.adjustmentValue,
        reason: formData.value.reason,
        notes: formData.value.notes
      })
    }
    emit('saved')
  } catch (error) {
    console.error('Error guardando ajuste:', error)
  } finally {
    saving.value = false
  }
}

const closeDialog = () => {
  dialog.value = false
}

const resetForm = () => {
  formData.value = {
    newStock: props.product?.currentStock || 0,
    reason: '',
    notes: '',
    category: null,
    adjustmentType: 'fixed',
    adjustmentValue: 0
  }
}
</script>
