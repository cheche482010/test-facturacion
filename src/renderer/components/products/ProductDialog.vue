<template>
  <v-dialog v-model="dialog" max-width="800px" persistent>
    <v-card>
      <v-card-title>
        <span class="text-h5">
          {{ isEditing ? 'Editar Producto' : 'Nuevo Producto' }}
        </span>
      </v-card-title>

      <v-card-text>
        <v-form ref="form" v-model="valid">
          <v-row>
            <!-- Información básica -->
            <v-col cols="12">
              <h3 class="text-h6 mb-3">Información Básica</h3>
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field
                v-model="formData.internalCode"
                label="Código Interno *"
                :rules="[rules.required]"
                variant="outlined"
                density="compact"
              />
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field
                v-model="formData.barcode"
                label="Código de Barras"
                variant="outlined"
                density="compact"
                append-inner-icon="mdi-barcode-scan"
                @click:append-inner="scanBarcode"
              />
            </v-col>

            <v-col cols="12">
              <v-text-field
                v-model="formData.name"
                label="Nombre del Producto *"
                :rules="[rules.required]"
                variant="outlined"
                density="compact"
              />
            </v-col>

            <v-col cols="12">
              <v-textarea
                v-model="formData.description"
                label="Descripción"
                variant="outlined"
                density="compact"
                rows="2"
              />
            </v-col>

            <v-col cols="12" md="6">
              <v-select
                v-model="formData.categoryId"
                :items="categories"
                item-title="name"
                item-value="id"
                label="Categoría"
                variant="outlined"
                density="compact"
              />
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field
                v-model="formData.brand"
                label="Marca"
                variant="outlined"
                density="compact"
              />
            </v-col>

            <v-col cols="12" md="6">
              <v-select
                v-model="formData.unit"
                :items="unitOptions"
                label="Unidad de Medida"
                variant="outlined"
                density="compact"
              />
            </v-col>

            <v-col cols="12" md="6">
              <v-select
                v-model="formData.status"
                :items="statusOptions"
                label="Estado"
                variant="outlined"
                density="compact"
              />
            </v-col>

            <!-- Precios y costos -->
            <v-col cols="12">
              <h3 class="text-h6 mb-3 mt-4">Precios y Costos</h3>
            </v-col>

            <v-col cols="12" md="4">
              <v-text-field
                v-model.number="formData.costPrice"
                label="Costo de Compra *"
                :rules="[rules.required, rules.positive]"
                variant="outlined"
                density="compact"
                type="number"
                step="0.01"
                @input="calculatePrices"
              />
            </v-col>

            <v-col cols="12" md="4">
              <v-select
                v-model="formData.costCurrency"
                :items="currencyOptions"
                label="Moneda del Costo"
                variant="outlined"
                density="compact"
                @update:model-value="calculatePrices"
              />
            </v-col>

            <v-col cols="12" md="4">
              <v-text-field
                v-model.number="formData.profitPercentage"
                label="% Ganancia"
                variant="outlined"
                density="compact"
                type="number"
                step="0.01"
                suffix="%"
                @input="calculatePrices"
              />
            </v-col>

            <v-col cols="12" md="4">
              <v-text-field
                v-model.number="formData.retailPrice"
                label="Precio Detal"
                variant="outlined"
                density="compact"
                type="number"
                step="0.01"
                :readonly="autoPricing"
              />
            </v-col>

            <v-col cols="12" md="4">
              <v-text-field
                v-model.number="formData.wholesalePrice"
                label="Precio Mayorista"
                variant="outlined"
                density="compact"
                type="number"
                step="0.01"
                :readonly="autoPricing"
              />
            </v-col>

            <v-col cols="12" md="4">
              <v-text-field
                v-model.number="formData.dollar_price"
                label="Precio en USD"
                variant="outlined"
                density="compact"
                type="number"
                step="0.01"
              />
            </v-col>

            <v-col cols="12">
              <v-switch
                v-model="autoPricing"
                label="Cálculo automático de precios"
                color="primary"
                @update:model-value="calculatePrices"
              />
            </v-col>

            <!-- Impuestos -->
            <v-col cols="12" md="6">
              <v-text-field
                v-model.number="formData.taxRate"
                label="Tasa de IVA (%)"
                variant="outlined"
                density="compact"
                type="number"
                step="0.01"
                suffix="%"
              />
            </v-col>

            <!-- Inventario -->
            <v-col cols="12">
              <h3 class="text-h6 mb-3 mt-4">Control de Inventario</h3>
            </v-col>

            <v-col cols="12" md="4">
              <v-text-field
                v-model.number="formData.currentStock"
                label="Stock Actual"
                variant="outlined"
                density="compact"
                type="number"
                :readonly="isEditing"
              />
            </v-col>

            <v-col cols="12" md="4">
              <v-text-field
                v-model.number="formData.minStock"
                label="Stock Mínimo"
                variant="outlined"
                density="compact"
                type="number"
              />
            </v-col>

            <v-col cols="12" md="4">
              <v-text-field
                v-model.number="formData.maxStock"
                label="Stock Máximo"
                variant="outlined"
                density="compact"
                type="number"
              />
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field
                v-model="formData.location"
                label="Ubicación en Almacén"
                variant="outlined"
                density="compact"
              />
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field
                v-model="formData.expirationDate"
                label="Fecha de Vencimiento"
                variant="outlined"
                density="compact"
                type="date"
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
          @click="saveProduct"
        >
          {{ isEditing ? 'Actualizar' : 'Crear' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useProductStore } from '../../stores/products'
import { useAppStore } from '../../stores/app'

const props = defineProps({
  modelValue: Boolean,
  product: Object,
  categories: Array
})

const emit = defineEmits(['update:modelValue', 'saved'])

const productStore = useProductStore()
const appStore = useAppStore()

// Estado reactivo
const valid = ref(false)
const saving = ref(false)
const autoPricing = ref(true)
const form = ref(null)

// Opciones
const unitOptions = [
  { title: 'Unidad', value: 'unidad' },
  { title: 'Kilogramos', value: 'kg' },
  { title: 'Litros', value: 'litros' },
  { title: 'Metros', value: 'metros' },
  { title: 'Cajas', value: 'cajas' }
]

const statusOptions = [
  { title: 'Activo', value: 'activo' },
  { title: 'Descontinuado', value: 'descontinuado' },
  { title: 'Agotado', value: 'agotado' }
]

const currencyOptions = [
  { title: 'Bolívares (VES)', value: 'VES' },
  { title: 'Dólares (USD)', value: 'USD' }
]

// Reglas de validación
const rules = {
  required: value => !!value || 'Este campo es requerido',
  positive: value => value > 0 || 'Debe ser mayor a 0'
}

// Datos del formulario
const formData = ref({
  internalCode: '',
  barcode: '',
  name: '',
  description: '',
  brand: '',
  unit: 'unidad',
  categoryId: null,
  costPrice: 0,
  costCurrency: 'VES',
  profitPercentage: 30,
  retailPrice: 0,
  wholesalePrice: 0,
  dollar_price: 0,
  taxRate: 16,
  currentStock: 0,
  minStock: 5,
  maxStock: 100,
  location: '',
  status: 'activo',
  expirationDate: null
})

// Computed properties
const dialog = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const isEditing = computed(() => !!props.product)

const resetForm = () => {
  formData.value = {
    internalCode: '',
    barcode: '',
    name: '',
    description: '',
    brand: '',
    unit: 'unidad',
    categoryId: null,
    costPrice: 0,
    costCurrency: 'VES',
    profitPercentage: 30,
    retailPrice: 0,
    wholesalePrice: 0,
    dollarPrice: 0,
    taxRate: 16,
    currentStock: 0,
    minStock: 5,
    maxStock: 100,
    location: '',
    status: 'activo',
    expirationDate: null
  }
  autoPricing.value = true
  form.value?.resetValidation()
}

// Watchers
watch(() => props.product, (newProduct) => {
  if (newProduct) {
    Object.assign(formData.value, newProduct)
    autoPricing.value = false
  } else {
    resetForm()
  }
}, { immediate: true })

// Métodos
const calculatePrices = () => {
  if (!autoPricing.value) return

  const cost = formData.value.costPrice || 0
  const profitPercent = formData.value.profitPercentage || 0
  const exchangeRate = appStore.settings.exchangeRate || 1

  // Convertir costo a VES si está en USD
  let costInVES = cost
  if (formData.value.costCurrency === 'USD') {
    costInVES = cost * exchangeRate
  }

  // Calcular precio retail
  const profit = costInVES * (profitPercent / 100)
  formData.value.retailPrice = Math.round((costInVES + profit) * 100) / 100

  // Calcular precio mayorista (10% menos)
  formData.value.wholesalePrice = Math.round(formData.value.retailPrice * 0.9 * 100) / 100

  // Calcular precio en dólares
  formData.value.dollarPrice = Math.round((formData.value.retailPrice / exchangeRate) * 100) / 100
}

const generateBarcode = () => {
  if (!formData.value.barcode) {
    // Generar código de barras automático
    const timestamp = Date.now().toString()
    formData.value.barcode = timestamp.slice(-10)
  }
}

const scanBarcode = () => {
  // Aquí se implementaría la funcionalidad de escaneo
  // Por ahora, generar código automático
  generateBarcode()
}

const saveProduct = async () => {
  if (!form.value.validate()) return

  saving.value = true
  try {
    if (isEditing.value) {
      await productStore.updateProduct(props.product.id, formData.value)
    } else {
      // Generar código de barras si no existe
      if (!formData.value.barcode) {
        generateBarcode()
      }
      await productStore.createProduct(formData.value)
    }
    emit('saved')
  } catch (error) {
    console.error('Error guardando producto:', error)
  } finally {
    saving.value = false
  }
}

const closeDialog = () => {
  dialog.value = false
}

</script>
