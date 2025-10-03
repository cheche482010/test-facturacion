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

<script>
import paymentDialogLogic from './PaymentDialog.js'

export default paymentDialogLogic
</script>
