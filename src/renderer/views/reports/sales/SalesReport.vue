<template>
  <v-card-text>
    <!-- Filtros en tiempo real -->
    <v-card variant="outlined" class="mb-4">
      <v-card-title class="text-subtitle-1 font-weight-bold">
        <v-icon class="me-2">mdi-filter-variant</v-icon>
        Filtros de Reporte
      </v-card-title>
      <v-card-text>
        <v-row>
          <v-col cols="12" md="3">
            <v-text-field v-model="filters.startDate" label="Fecha Desde" type="date" density="compact"
              variant="outlined"></v-text-field>
          </v-col>
          <v-col cols="12" md="3">
            <v-text-field v-model="filters.endDate" label="Fecha Hasta" type="date" density="compact"
              variant="outlined"></v-text-field>
          </v-col>
          <v-col cols="12" md="3">
            <v-text-field v-model="filters.batch" label="Lote (opcional)" density="compact" variant="outlined"
              clearable placeholder="Buscar lote..."></v-text-field>
          </v-col>
          <v-col cols="12" md="3">
            <v-btn @click="loadAllReport" color="info" :loading="loading" block prepend-icon="mdi-refresh">
              Cargar Todo
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Opciones de exportación -->
    <v-row v-if="data && data.length > 0" class="mb-4">
      <v-col cols="12">
        <v-card variant="outlined" class="pa-4">
          <v-card-title class="text-subtitle-1 font-weight-bold pa-0 mb-3">
            <v-icon class="me-2">mdi-download</v-icon>
            Exportar Reporte
          </v-card-title>
          <v-card-text class="pa-0">
            <v-row>
              <!-- Selección de datos -->
              <v-col cols="12" md="6">
                <div class="text-body-2 font-weight-medium mb-2">Datos a Exportar</div>
                <v-checkbox v-model="exportOptions.exportAll" label="Exportar todos los lotes" @change="onExportAllChange" class="mb-2"></v-checkbox>
                <div v-if="!exportOptions.exportAll" class="ml-4">
                  <div class="text-caption mb-2">Seleccionar lotes específicos:</div>
                  <v-chip-group v-model="exportOptions.selectedBatches" multiple column>
                    <v-chip v-for="batch in data" :key="batch.id" :value="batch.id" size="small" variant="outlined">
                      Lote {{ batch.lote }}
                    </v-chip>
                  </v-chip-group>
                </div>
              </v-col>

              <!-- Selección de formatos -->
              <v-col cols="12" md="4">
                <div class="text-body-2 font-weight-medium mb-2">Formatos de Exportación</div>
                <v-checkbox v-model="exportOptions.formats.excel" label="Excel (.xlsx)" class="mb-1"></v-checkbox>
                <v-checkbox v-model="exportOptions.formats.pdf" label="PDF (.pdf)" class="mb-1"></v-checkbox>
              </v-col>

              <!-- Botón de exportar -->
              <v-col cols="12" md="2" class="d-flex align-center">
                <v-btn @click="exportReport" color="primary" :disabled="!canExport" block prepend-icon="mdi-download">
                  Exportar
                </v-btn>
              </v-col>
            </v-row>

            <!-- Mensaje de validación -->
            <v-alert v-if="!canExport" type="info" density="compact" class="mt-3 mb-0">
              Selecciona al menos un lote y un formato de exportación
            </v-alert>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Tabla jerárquica: Lotes -> Ventas -> Detalles -->
    <v-card>
      <v-card-title>
        Reporte de Ventas Detallado por Lotes
        <v-spacer></v-spacer>
        <span class="text-caption">Tasa actual: {{ formatCurrency(currentDolarRate) }} Bs/USD</span>
      </v-card-title>

      <!-- Lista de Lotes -->
      <div style="padding: 8px;">
        <v-data-table
          :headers="batchHeaders"
          :items="data"
          :loading="loading"
          item-value="id"
          density="compact"
          show-expand
          :expanded.sync="expandedBatches"
          class="main-batches-table"
          :item-class="getBatchRowClass"
        >
        <template v-slot:item.openingDate="{ item }">
          {{ formatDate(item.openingDate) }}
        </template>
        <template v-slot:item.closingDate="{ item }">
          {{ item.closingDate ? formatDate(item.closingDate) : 'En curso' }}
        </template>
        <template v-slot:item.totalSales="{ item }">
          {{ item.summary.totalSales }}
        </template>
        <template v-slot:item.totalAmountBs="{ item }">
          {{ formatCurrency(item.summary.totalAmountBs) }} Bs
        </template>
        <template v-slot:item.totalSoldBs="{ item }">
          <span class="text-success">{{ formatCurrency(item.summary.totalSoldBs) }} Bs</span>
        </template>
        <template v-slot:item.totalChangeGivenBs="{ item }">
          <span class="text-warning">{{ formatCurrency(item.summary.totalChangeGivenBs) }} Bs</span>
        </template>

        <!-- Fila expandida con ventas del lote -->
        <template v-slot:expanded-row="{ columns, item }">
          <tr>
            <td :colspan="columns.length" class="pa-0">
              <v-card flat class="ma-2" style="border: 2px solid #1976d2; border-radius: 8px;">
                <v-card-title class="text-subtitle-1 primary--text font-weight-bold">
                  <v-icon color="primary" class="me-2">mdi-package-variant-closed</v-icon>
                  Ventas del Lote {{ item.lote }}
                  <v-spacer></v-spacer>
                  <v-chip color="primary" size="small" class="me-2">{{ item.sales.length }} ventas</v-chip>
                  <v-chip color="info" size="small" variant="outlined">
                    <v-icon size="small" class="me-1">mdi-calendar</v-icon>
                    {{ formatDate(item.openingDate) }}
                  </v-chip>
                </v-card-title>
                <v-card-text class="pa-0">
                  <!-- Tabla de ventas dentro del lote -->
                  <div style="padding: 8px;">
                    <v-data-table
                      :headers="saleHeaders"
                      :items="item.sales"
                      item-value="id"
                      density="compact"
                      show-expand
                      :expanded.sync="expandedSales"
                      :item-class="getSaleRowClass"
                      class="batch-sales-table"
                    >
                    <template v-slot:item.saleDate="{ item }">
                      {{ formatDate(item.saleDate) }}
                    </template>
                    <template v-slot:item.userName="{ item }">
                      {{ item.userName }}
                    </template>
                    <template v-slot:item.totalBs="{ item }">
                      {{ formatCurrency(item.totalBs) }} Bs
                    </template>
                    <template v-slot:item.totalSoldBs="{ item }">
                      <span class="text-success">{{ formatCurrency(item.totalSoldBs) }} Bs</span>
                    </template>
                    <template v-slot:item.changeGivenBs="{ item }">
                      <span class="text-warning">{{ formatCurrency(item.changeGivenBs) }} Bs</span>
                    </template>

                    <!-- Fila expandida con detalles de la venta -->
                    <template v-slot:expanded-row="{ columns, item }">
                      <tr>
                        <td :colspan="columns.length" class="pa-0">
                          <v-card flat class="ma-2" style="border: 2px solid #4caf50; border-radius: 8px;">
                            <v-card-title class="text-subtitle-1 success--text font-weight-bold">
                              <v-icon color="success" class="me-2">mdi-receipt</v-icon>
                              Detalles de Venta {{ item.saleNumber }}
                              <v-spacer></v-spacer>
                              <v-chip color="success" size="small" variant="outlined" class="me-2">
                                <v-icon size="small" class="me-1">mdi-cash</v-icon>
                                {{ formatCurrency(item.totalBs) }} Bs
                              </v-chip>
                              <v-chip color="warning" size="small" variant="outlined">
                                <v-icon size="small" class="me-1">mdi-cash-refund</v-icon>
                                {{ formatCurrency(item.changeGivenBs) }} Bs
                              </v-chip>
                            </v-card-title>
                            <v-card-text>
                              <!-- Resumen de la venta - Primera sección -->
                              <v-row class="mb-4">
                                <v-col cols="12">
                                  <v-card variant="outlined" class="pa-3" style="background-color: rgba(76, 175, 80, 0.05);">
                                    <div class="text-subtitle-1 font-weight-bold mb-3" style="color: #4caf50;">Resumen de Venta</div>
                                    <v-row>
                                      <v-col cols="12" md="3">
                                        <div><strong>Número:</strong> {{ item.saleNumber }}</div>
                                        <div><strong>Fecha:</strong> {{ formatDate(item.saleDate) }}</div>
                                        <div><strong>Usuario:</strong> {{ item.userName }}</div>
                                      </v-col>
                                      <v-col cols="12" md="3">
                                        <div><strong>Total Facturado:</strong> {{ formatCurrency(item.totalBs) }} Bs</div>
                                        <div><strong>Total Vendido:</strong> {{ formatCurrency(item.totalSoldBs) }} Bs</div>
                                        <div><strong>Cambio Dado:</strong> {{ formatCurrency(item.changeGivenBs) }} Bs</div>
                                      </v-col>
                                      <v-col cols="12" md="3">
                                        <div><strong>Tasa al Momento:</strong> {{ formatCurrency(item.dolarRateAtSale) }} Bs/USD</div>
                                        <div><strong>Productos:</strong> {{ getTotalProductUnits(item.items) }}</div>
                                        <div><strong>Métodos de Pago:</strong> {{ item.payments.length }}</div>
                                      </v-col>
                                      <v-col cols="12" md="3">
                                        <v-chip color="success" size="small" class="me-2">
                                          <v-icon size="small" class="me-1">mdi-package-variant</v-icon>
                                          {{ getTotalProductUnits(item.items) }} unidades
                                        </v-chip>
                                        <v-chip color="info" size="small">
                                          <v-icon size="small" class="me-1">mdi-credit-card</v-icon>
                                          {{ item.payments.length }} pagos
                                        </v-chip>
                                      </v-col>
                                    </v-row>
                                  </v-card>
                                </v-col>
                              </v-row>

                              <v-row>
                                <!-- Productos vendidos - Tabla con scroll -->
                                <v-col cols="12" md="8">
                                  <v-card variant="outlined" class="pa-2">
                                    <div class="text-subtitle-2 font-weight-bold mb-2 d-flex align-center">
                                      <v-icon color="primary" class="me-2">mdi-package-variant-closed</v-icon>
                                      Productos Vendidos ({{ getTotalProductUnits(item.items) }} unidades)
                                    </div>
                                    <div style="max-height: 300px; overflow-y: auto; border: 1px solid #e0e0e0; border-radius: 4px; padding: 8px;">
                                      <v-data-table
                                        :headers="productHeaders"
                                        :items="item.items"
                                        item-value="productCode"
                                        density="compact"
                                        hide-default-footer
                                        :items-per-page="-1"
                                        class="sale-products-table"
                                      >
                                        <template v-slot:item.productName="{ item }">
                                          <div class="text-caption font-weight-medium">{{ item.productName }}</div>
                                        </template>
                                        <template v-slot:item.productCode="{ item }">
                                          <v-chip size="small" variant="outlined">{{ item.productCode }}</v-chip>
                                        </template>
                                        <template v-slot:item.quantity="{ item }">
                                          <span class="font-weight-bold">{{ item.quantity }}</span>
                                        </template>
                                        <template v-slot:item.subtotalBs="{ item }">
                                          <span class="text-success font-weight-bold">{{ formatCurrency(item.subtotalBs) }} Bs</span>
                                        </template>
                                      </v-data-table>
                                    </div>
                                  </v-card>
                                </v-col>

                                <!-- Métodos de pago - Tercera sección -->
                                <v-col cols="12" md="4">
                                  <v-card variant="outlined" class="pa-2">
                                    <div class="text-subtitle-2 font-weight-bold mb-2 d-flex align-center">
                                      <v-icon color="success" class="me-2">mdi-credit-card</v-icon>
                                      Métodos de Pago ({{ item.payments.length }})
                                    </div>
                                    <div v-for="payment in item.payments" :key="payment.methodName" class="mb-3 pa-2"
                                         style="border: 1px solid #e8f5e8; border-radius: 4px; background-color: rgba(76, 175, 80, 0.02);">
                                      <div class="d-flex justify-space-between align-center mb-1">
                                        <span class="text-caption font-weight-bold">{{ payment.methodName }}</span>
                                        <v-chip color="success" size="small" variant="flat">
                                          {{ formatCurrency(payment.amount) }} Bs
                                        </v-chip>
                                      </div>
                                      <div v-if="payment.reference" class="text-caption text-medium-emphasis">
                                        <v-icon size="small" class="me-1">mdi-tag</v-icon>
                                        Ref: {{ payment.reference }}
                                      </div>
                                    </div>
                                  </v-card>
                                </v-col>
                              </v-row>

                              <!-- Notas adicionales -->
                              <v-row v-if="item.notes" class="mt-2">
                                <v-col cols="12">
                                  <v-card variant="outlined" class="pa-2">
                                    <div class="text-subtitle-2 font-weight-bold mb-1">Notas</div>
                                    <div class="text-caption">{{ item.notes }}</div>
                                  </v-card>
                                </v-col>
                              </v-row>
                            </v-card-text>
                          </v-card>
                        </td>
                      </tr>
                    </template>
                    </v-data-table>
                  </div>
                </v-card-text>
              </v-card>
            </td>
          </tr>
        </template>
        </v-data-table>
      </div>
    </v-card>
  </v-card-text>
</template>

<script>
import salesReportLogic from './SalesReport.js'

export default salesReportLogic
</script>

<style scoped>
.selected-batch-row {
  background-color: rgba(25, 118, 210, 0.08) !important;
  border-left: 4px solid #1976d2 !important;
  box-shadow: 0 2px 8px rgba(25, 118, 210, 0.3) !important;
  position: relative;
  animation: pulse-blue 2s infinite;
}

.selected-batch-row::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border: 2px solid #1976d2;
  border-radius: 4px;
  pointer-events: none;
}

@keyframes pulse-blue {
  0% { box-shadow: 0 2px 8px rgba(25, 118, 210, 0.3); }
  50% { box-shadow: 0 2px 12px rgba(25, 118, 210, 0.5); }
  100% { box-shadow: 0 2px 8px rgba(25, 118, 210, 0.3); }
}

.selected-batch-row:hover {
  background-color: rgba(25, 118, 210, 0.12) !important;
}

.selected-sale-row {
  background-color: rgba(76, 175, 80, 0.08) !important;
  border-left: 4px solid #4caf50 !important;
  box-shadow: 0 2px 8px rgba(76, 175, 80, 0.3) !important;
  position: relative;
  animation: pulse-green 2s infinite;
}

.selected-sale-row::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border: 2px solid #4caf50;
  border-radius: 4px;
  pointer-events: none;
}

@keyframes pulse-green {
  0% { box-shadow: 0 2px 8px rgba(76, 175, 80, 0.3); }
  50% { box-shadow: 0 2px 12px rgba(76, 175, 80, 0.5); }
  100% { box-shadow: 0 2px 8px rgba(76, 175, 80, 0.3); }
}

.selected-sale-row:hover {
  background-color: rgba(76, 175, 80, 0.12) !important;
}

/* Estilos para la tabla de productos con scroll */
.sale-products-table .v-data-table-header {
  background-color: #f5f5f5 !important;
}

.sale-products-table .v-data-table-header th {
  font-weight: bold !important;
  font-size: 0.75rem !important;
  padding: 8px 6px !important;
  border-bottom: 1px solid #e0e0e0 !important;
}

.sale-products-table .v-data-table__td {
  padding: 6px 6px !important;
  font-size: 0.75rem !important;
  border-bottom: 1px solid #f0f0f0 !important;
}

.sale-products-table .v-data-table__tr:last-child .v-data-table__td {
  border-bottom: none !important;
}

/* Estilos para la tabla de ventas del lote */
.batch-sales-table .v-data-table-header {
  background-color: #f8f9fa !important;
}

.batch-sales-table .v-data-table-header th {
  font-weight: bold !important;
  font-size: 0.75rem !important;
  padding: 6px 8px !important;
}

.batch-sales-table .v-data-table__td {
  padding: 6px 8px !important;
  font-size: 0.75rem !important;
}

/* Estilos para la tabla principal de lotes */
.main-batches-table .v-data-table-header {
  background-color: #f8f9fa !important;
}

.main-batches-table .v-data-table-header th {
  font-weight: bold !important;
  font-size: 0.8rem !important;
  padding: 8px 12px !important;
}

.main-batches-table .v-data-table__td {
  padding: 8px 12px !important;
  font-size: 0.8rem !important;
}
</style>