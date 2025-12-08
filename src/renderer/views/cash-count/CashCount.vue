<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title class="d-flex align-center justify-space-between">
            <div class="text-h5">Arqueo de caja</div>
            <div class="d-flex align-center gap-4" style="gap: 12px;">
              <v-text-field
                v-model="selectedDate"
                label="Fecha"
                type="date"
                density="compact"
                hide-details
                style="max-width: 220px;"
              />
              <v-btn color="primary" :loading="loading" @click="loadData">
                <v-icon start>mdi-refresh</v-icon>
                Actualizar
              </v-btn>
            </div>
          </v-card-title>
          <v-card-subtitle v-if="cashCount?.range">
            Hora de apertura configurada: {{ cashCount.range.openingTime }} | Rango del arqueo: {{ formatDate(cashCount.range.start) }} — {{ formatDate(cashCount.range.end) }}
          </v-card-subtitle>

          <v-card-text>
            <v-row>
              <v-col cols="12" md="3">
                <v-card class="pa-4" elevation="1">
                  <div class="text-caption text-medium-emphasis">Total ventas del día</div>
                  <div class="text-h5 mt-1">{{ formatCurrency(cashCount?.totals?.total || 0) }}</div>
                </v-card>
              </v-col>
              <v-col cols="12" md="3">
                <v-card class="pa-4" elevation="1">
                  <div class="text-caption text-medium-emphasis">Subtotal</div>
                  <div class="text-h5 mt-1">{{ formatCurrency(cashCount?.totals?.subtotal || 0) }}</div>
                </v-card>
              </v-col>
              <v-col cols="12" md="3">
                <v-card class="pa-4" elevation="1">
                  <div class="text-caption text-medium-emphasis">Impuestos</div>
                  <div class="text-h5 mt-1">{{ formatCurrency(cashCount?.totals?.tax || 0) }}</div>
                </v-card>
              </v-col>
              <v-col cols="12" md="3">
                <v-card class="pa-4" elevation="1">
                  <div class="text-caption text-medium-emphasis">Transacciones</div>
                  <div class="text-h5 mt-1">{{ cashCount?.totals?.count || 0 }}</div>
                </v-card>
              </v-col>
            </v-row>

            <v-row class="mt-1">
              <v-col cols="12" md="6">
                <v-card elevation="1">
                  <v-card-title class="text-subtitle-1">Por método de pago</v-card-title>
                  <v-divider></v-divider>
                  <v-card-text>
                    <v-table density="compact">
                      <thead>
                        <tr>
                          <th class="text-left">Método</th>
                          <th class="text-right">Transacciones</th>
                          <th class="text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="p in cashCount?.byPaymentMethod || []" :key="p.paymentMethod">
                          <td>{{ paymentLabel(p.paymentMethod) }}</td>
                          <td class="text-right">{{ p.count }}</td>
                          <td class="text-right">{{ formatCurrency(p.total) }}</td>
                        </tr>
                        <tr v-if="(cashCount?.byPaymentMethod || []).length === 0">
                          <td colspan="3" class="text-center text-medium-emphasis">Sin datos</td>
                        </tr>
                      </tbody>
                    </v-table>
                  </v-card-text>
                </v-card>
              </v-col>

              <v-col cols="12" md="6">
                <v-card elevation="1">
                  <v-card-title class="text-subtitle-1">Acumulados</v-card-title>
                  <v-divider></v-divider>
                  <v-card-text>
                    <v-row>
                      <v-col cols="12" md="6">
                        <v-card class="pa-4" variant="tonal">
                          <div class="text-caption text-medium-emphasis">Semana a la fecha</div>
                          <div class="text-h6 mt-1">{{ formatCurrency(cashCount?.weekToDateTotal || 0) }}</div>
                        </v-card>
                      </v-col>
                      <v-col cols="12" md="6">
                        <v-card class="pa-4" variant="tonal">
                          <div class="text-caption text-medium-emphasis">Mes a la fecha</div>
                          <div class="text-h6 mt-1">{{ formatCurrency(cashCount?.monthToDateTotal || 0) }}</div>
                        </v-card>
                      </v-col>
                    </v-row>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>

            <v-row class="mt-1">
              <v-col cols="12">
                <v-card elevation="1">
                  <v-card-title class="text-subtitle-1">Ventas del día</v-card-title>
                  <v-divider></v-divider>
                  <v-card-text>
                    <v-table density="compact">
                      <thead>
                        <tr>
                          <th class="text-left">N°</th>
                          <th class="text-left">Hora</th>
                          <th class="text-left">Método</th>
                          <th class="text-right">Total</th>
                          <th class="text-left">Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="s in cashCount?.sales || []" :key="s.id">
                          <td>{{ s.sale_number }}</td>
                          <td>{{ formatTime(s.sale_date) }}</td>
                          <td>{{ paymentLabel(s.payment_method) }}</td>
                          <td class="text-right">{{ formatCurrency(s.total) }}</td>
                          <td>{{ s.status }}</td>
                        </tr>
                        <tr v-if="(cashCount?.sales || []).length === 0">
                          <td colspan="5" class="text-center text-medium-emphasis">Sin ventas</td>
                        </tr>
                      </tbody>
                    </v-table>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import cashCountLogic from './CashCount.js'

export default cashCountLogic
</script>
