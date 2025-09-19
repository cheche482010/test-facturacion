<template>
  <v-dialog v-model="dialog" max-width="700px" persistent>
    <v-card>
      <v-card-title>
        <span class="text-h5">Procesar Pago</span>
      </v-card-title>

      <v-card-text>
        <!-- Resumen de la venta -->
        <v-card variant="outlined" class="mb-4">
          <v-card-text>
            <div class="d-flex justify-space-between align-center">
              <div>
                <div class="text-h6">Total a Pagar</div>
                <div class="text-caption">{{ saleData.items.length }} productos</div>
              </div>
              <div class="text-h4 text-primary">
                {{ formatCurrency(saleData.total) }}
              </div>
            </div>
          </v-card-text>
        </v-card>

        <v-form ref="form" v-model="valid">
          <!-- Método de pago -->
          <v-row>
            <v-col cols="12">
              <v-select
                v-model="paymentData.method"
                :items="paymentMethods"
                label="Método de Pago *"
                :rules="[rules.required]"
                variant="outlined"
                density="compact"
                @update:model-value="onPaymentMethodChange"
              />
            </v-col>
          </v-row>

          <!-- Campos específicos por método de pago -->
          <v-row v-if="paymentData.method === 'efectivo_bs' || paymentData.method === 'efectivo_usd'">
            <v-col cols="12" md="6">
              <v-text-field
                v-model.number="paymentData.receivedAmount"
                :label="`Monto Recibido (${paymentData.method === 'efectivo_usd' ? 'USD' : 'Bs'}) *`"
                :rules="[rules.required, rules.positive]"
                variant="outlined"
                density="compact"
                type="number"
                step="0.01"
                @input="calculateChange"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                :model-value="changeAmount"
                :label="`Cambio (${paymentData.method === 'efectivo_usd' ? 'USD' : 'Bs'})`"
                variant="outlined"
                density="compact"
                readonly
                :color="changeAmount >= 0 ? 'success' : 'error'"
              />
            </v-col>
          </v-row>

          <v-row v-else-if="paymentData.method === 'transferencia'">
            <v-col cols="12" md="6">
              <v-text-field
                v-model="paymentData.referenceNumber"
                label="Número de Referencia *"
                :rules="[rules.required]"
                variant="outlined"
                density="compact"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-select
                v-model="paymentData.bank"
                :items="banks"
                label="Banco"
                variant="outlined"
                density="compact"
              />
            </v-col>
          </v-row>

          <v-row v-else-if="paymentData.method === 'pos'">
            <v-col cols="12" md="6">
              <v-text-field
                v-model="paymentData.referenceNumber"
                label="Número de Lote *"
                :rules="[rules.required]"
                variant="outlined"
                density="compact"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="paymentData.lastFourDigits"
                label="Últimos 4 dígitos"
                variant="outlined"
                density="compact"
                maxlength="4"
              />
            </v-col>
          </v-row>

          <v-row v-else-if="paymentData.method === 'pago_movil'">
            <v-col cols="12" md="6">
              <v-text-field
                v-model="paymentData.referenceNumber"
                label="Número de Referencia *"
                :rules="[rules.required]"
                variant="outlined"
                density="compact"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="paymentData.phoneNumber"
                label="Teléfono"
                variant="outlined"
                density="compact"
              />
            </v-col>
          </v-row>

          <v-row v-else-if="paymentData.method === 'credito'">
            <v-col cols="12" md="6">
              <v-text-field
                v-model.number="paymentData.paidAmount"
                label="Monto Pagado"
                variant="outlined"
                density="compact"
                type="number"
                step="0.01"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="paymentData.dueDate"
                label="Fecha de Vencimiento"
                variant="outlined"
                density="compact"
                type="date"
              />
            </v-col>
          </v-row>

          <!-- Tipo de documento -->
          <v-row>
            <v-col cols="12" md="6">
              <v-select
                v-model="paymentData.documentType"
                :items="documentTypes"
                label="Tipo de Documento"
                variant="outlined"
                density="compact"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="paymentData.notes"
                label="Notas"
                variant="outlined"
                density="compact"
              />
            </v-col>
          </v-row>

          <!-- Calculadora de cambio -->
          <v-card v-if="showCalculator" variant="outlined" class="mt-4">
            <v-card-title class="text-subtitle-1">Calculadora de Cambio</v-card-title>
            <v-card-text>
              <Calculator @result="onCalculatorResult" />
            </v-card-text>
          </v-card>
        </v-form>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn @click="closeDialog">Cancelar</v-btn>
        <v-btn
          color="primary"
          :disabled="!valid || (paymentData.method.includes('efectivo') && changeAmount < 0)"
          :loading="processing"
          @click="processSale"
        >
          Completar Venta
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import Calculator from './Calculator.vue'
import { useSalesStore } from '../../stores/sales'
import { useAppStore } from '../../stores/app'

const props = defineProps({
  modelValue: Boolean,
  saleData: Object
})

const emit = defineEmits(['update:modelValue', 'payment-completed'])

const salesStore = useSalesStore()
const appStore = useAppStore()

// Estado reactivo
const valid = ref(false)
const processing = ref(false)
const showCalculator = ref(false)
const form = ref(null)

// Opciones
const paymentMethods = [
  { title: 'Efectivo (Bs)', value: 'efectivo_bs' },
  { title: 'Efectivo (USD)', value: 'efectivo_usd' },
  { title: 'Transferencia', value: 'transferencia' },
  { title: 'POS', value: 'pos' },
  { title: 'Pago Móvil', value: 'pago_movil' },
  { title: 'Crédito', value: 'credito' }
]

const documentTypes = [
  { title: 'Factura', value: 'factura' },
  { title: 'Ticket', value: 'ticket' },
  { title: 'Nota de Débito', value: 'nota_debito' }
]

const banks = [
  'Banesco', 'Mercantil', 'Venezuela', 'Provincial', 'Bicentenario',
  'Tesoro', 'BOD', 'Bancaribe', 'Exterior', 'Activo'
]

// Reglas de validación
const rules = {
  required: value => !!value || 'Este campo es requerido',
  positive: value => value > 0 || 'Debe ser mayor a 0'
}

// Datos del pago
const paymentData = ref({
  method: 'efectivo_bs',
  receivedAmount: 0,
  paidAmount: 0,
  referenceNumber: '',
  bank: '',
  phoneNumber: '',
  lastFourDigits: '',
  dueDate: '',
  documentType: 'ticket',
  notes: ''
})

// Computed properties
const dialog = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const exchangeRate = computed(() => appStore.settings.exchangeRate || 1)

const totalInPaymentCurrency = computed(() => {
  if (paymentData.value.method === 'efectivo_usd') {
    return props.saleData.total / exchangeRate.value
  }
  return props.saleData.total
})

const changeAmount = computed(() => {
  if (!paymentData.value.receivedAmount) return 0
  return paymentData.value.receivedAmount - totalInPaymentCurrency.value
})

// Métodos
const onPaymentMethodChange = () => {
  // Resetear campos específicos
  paymentData.value.receivedAmount = 0
  paymentData.value.referenceNumber = ''
  paymentData.value.bank = ''
  paymentData.value.phoneNumber = ''
  paymentData.value.lastFourDigits = ''
  
  // Mostrar calculadora para efectivo
  showCalculator.value = paymentData.value.method.includes('efectivo')
  
  // Establecer monto recibido por defecto
  if (paymentData.value.method.includes('efectivo')) {
    paymentData.value.receivedAmount = totalInPaymentCurrency.value
  }
}

const calculateChange = () => {
  // El cambio se calcula automáticamente en el computed
}

const onCalculatorResult = (result) => {
  paymentData.value.receivedAmount = result
}

const processSale = async () => {
  if (!form.value.validate()) return

  processing.value = true
  try {
    const salePayload = {
      ...props.saleData,
      payment: {
        ...paymentData.value,
        changeAmount: changeAmount.value,
        totalInPaymentCurrency: totalInPaymentCurrency.value
      }
    }

    const result = await salesStore.createSale(salePayload)
    emit('payment-completed', result)
  } catch (error) {
    console.error('Error procesando venta:', error)
  } finally {
    processing.value = false
  }
}

const closeDialog = () => {
  dialog.value = false
}

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('es-VE', {
    style: 'currency',
    currency: 'VES'
  }).format(amount)
}

// Watchers
watch(() => props.saleData?.total, (newTotal) => {
  if (newTotal && paymentData.value.method.includes('efectivo')) {
    paymentData.value.receivedAmount = totalInPaymentCurrency.value
  }
})

watch(dialog, (isOpen) => {
  if (isOpen) {
    // Resetear formulario
    paymentData.value = {
      method: 'efectivo_bs',
      receivedAmount: totalInPaymentCurrency.value,
      paidAmount: 0,
      referenceNumber: '',
      bank: '',
      phoneNumber: '',
      lastFourDigits: '',
      dueDate: '',
      documentType: 'ticket',
      notes: ''
    }
    showCalculator.value = true
  }
})
</script>
