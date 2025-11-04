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
              <div class="text-right">
                <div class="text-h5 text-primary">{{ formatCurrency(saleData.totalBs, 'VES') }}</div>
                <div class="text-body-2 text-medium-emphasis">{{ formatCurrency(saleData.totalUsd, 'USD') }}</div>
              </div>
            </div>
          </v-card-text>
        </v-card>

        <!-- Pagos existentes -->
        <v-card v-if="payments.length > 0" variant="outlined" class="mb-4">
          <v-card-title class="text-subtitle-1">Pagos Registrados</v-card-title>
          <v-card-text>
            <div v-for="(payment, index) in payments" :key="index" class="d-flex justify-space-between align-center mb-2">
              <div>
                <div class="font-weight-medium">{{ payment.methodName }}</div>
                <div class="text-caption text-medium-emphasis">{{ payment.reference || 'Sin referencia' }}</div>
              </div>
              <div class="text-right d-flex align-center">
                <div class="font-weight-bold mr-2">{{ formatCurrency(payment.amount, payment.currency) }}</div>
                <v-btn icon="mdi-pencil" variant="text" size="small" color="primary" @click="editPayment(index)" />
                <v-btn icon="mdi-delete" variant="text" size="small" color="error" @click="removePayment(index)" />
              </div>
            </div>
            <v-divider class="my-2"></v-divider>
            <div class="d-flex justify-space-between align-center">
              <div class="font-weight-bold">Total Pagado</div>
              <div class="text-right">
                <div class="font-weight-bold text-success">{{ formatCurrency(totalPaid, 'VES') }}</div>
                <div class="text-caption text-medium-emphasis">{{ formatCurrency(totalPaid / exchangeRate, 'USD') }}</div>
              </div>
            </div>
            <div class="d-flex justify-space-between align-center mt-1">
              <div class="font-weight-bold">Restante</div>
              <div class="text-right">
                <div class="font-weight-bold" :class="remainingAmount <= 0 ? 'text-success' : 'text-error'">
                  {{ formatCurrency(remainingAmount, 'VES') }}
                </div>
                <div class="text-caption text-medium-emphasis">{{ formatCurrency(remainingAmount / exchangeRate, 'USD') }}</div>
              </div>
            </div>
            <div v-if="changeAmount > 0" class="d-flex justify-space-between align-center mt-1">
              <div class="font-weight-bold text-warning">Cambio a devolver</div>
              <div class="text-right">
                <div class="font-weight-bold text-warning">
                  {{ formatCurrency(changeAmount, 'VES') }}
                </div>
                <div class="text-caption text-medium-emphasis">{{ formatCurrency(changeAmount / exchangeRate, 'USD') }}</div>
              </div>
            </div>
          </v-card-text>
        </v-card>

        <v-form ref="form" v-model="valid" v-if="remainingAmount > 0">
          <!-- Método de pago -->
          <v-row>
            <v-col cols="12" md="8">
              <v-select
                v-model="paymentData.paymentMethodId"
                :items="availablePaymentMethods"
                item-title="name"
                item-value="id"
                label="Método de Pago *"
                :rules="[rules.required]"
                variant="outlined"
                density="compact"
                @update:model-value="onPaymentMethodChange"
              />
            </v-col>
            <v-col cols="12" md="4">
              <v-text-field
                v-model.number="paymentData.amount"
                label="Monto *"
                :rules="[rules.required, rules.positive]"
                variant="outlined"
                density="compact"
                type="number"
                step="0.01"
                :max="remainingAmount"
              />
            </v-col>
          </v-row>

          <!-- Campos específicos por método de pago -->
          <v-row>
            <v-col cols="12" md="6" v-if="!isCashPayment">
              <v-text-field
                v-model="paymentData.reference"
                label="Referencia (opcional)"
                variant="outlined"
                density="compact"
                placeholder="Número de lote, referencia, etc."
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="paymentData.notes"
                label="Notas (opcional)"
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
          color="success"
          variant="outlined"
          :disabled="!valid"
          @click="addPayment"
        >
          Agregar Pago
        </v-btn>
        <v-btn
          color="primary"
          :disabled="remainingAmount > 0 && changeAmount <= 0"
          :loading="processing"
          @click="completeSale"
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
