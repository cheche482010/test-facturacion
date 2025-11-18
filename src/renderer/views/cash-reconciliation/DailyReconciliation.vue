<template>
  <v-card>
    <v-card-title>Gestión del Día</v-card-title>
    <v-card-text>
      <!-- Loading Indicator -->
      <div v-if="isLoading" class="text-center pa-4">
        <v-progress-circular indeterminate color="primary"></v-progress-circular>
        <p class="mt-2">Cargando...</p>
      </div>

      <!-- Error Display -->
      <v-alert v-if="error" type="error" variant="tonal" closable class="mb-4">
        {{ error }}
      </v-alert>

      <!-- Main Content -->
      <div v-if="!isLoading">
        <div v-if="!reconciliation">
          <v-alert type="info" variant="tonal" class="mb-4">
            La caja está cerrada. Ingrese el saldo inicial para comenzar.
          </v-alert>
          <v-row>
            <v-col cols="12" md="3">
             <v-text-field
               v-model.number="openForm.openingBalanceBs"
               label="Saldo Inicial BS"
               type="number"
               prefix="Bs"
               variant="outlined"
             ></v-text-field>
           </v-col>
           <v-col cols="12" md="3">
             <v-text-field
               v-model.number="openForm.openingBalanceUsd"
               label="Saldo Inicial USD"
               type="number"
               prefix="$"
               variant="outlined"
             ></v-text-field>
           </v-col>
           <v-col cols="12" md="4">
             <v-textarea
               v-model="openForm.notes"
               label="Notas de Apertura (Opcional)"
               rows="1"
               variant="outlined"
             ></v-textarea>
           </v-col>
           <v-col cols="12" md="2" class="d-flex align-center">
             <v-btn color="primary" @click="handleOpenReconciliation" :loading="isLoading" block>
               Abrir Caja
             </v-btn>
           </v-col>
         </v-row>
        </div>

        <!-- State: Reconciliation is open -> Show Details and Close Form -->
        <div v-else>
          <v-row>
            <!-- Info -->
            <v-col cols="12" md="4">
              <v-card variant="tonal">
                <v-list-item :title="reconciliation.user.username" subtitle="Abierta por"></v-list-item>
                <v-list-item :title="formatCurrency(reconciliation.openingBalanceBs, 'VES')" subtitle="Saldo Inicial BS"></v-list-item>
                <v-list-item :title="formatCurrency(reconciliation.openingBalanceUsd, 'USD')" subtitle="Saldo Inicial USD"></v-list-item>
              </v-card>
            </v-col>
            <!-- Sales -->
            <v-col cols="12" md="4">
              <v-card variant="tonal" color="success">
                <v-list-item :title="formatCurrency(reconciliation.totalSalesBs, 'VES')" subtitle="Ventas del Día BS"></v-list-item>
                <v-list-item :title="formatCurrency(reconciliation.totalSalesUsd, 'USD')" subtitle="Ventas del Día USD"></v-list-item>
                 <v-list-item :title="reconciliation.salesCount" subtitle="Nº de Ventas"></v-list-item>
              </v-card>
            </v-col>
             <!-- Expected -->
            <v-col cols="12" md="4">
               <v-card variant="tonal" color="info">
                <v-list-item :title="formatCurrency(expectedBalance)" subtitle="Saldo Esperado en Caja"></v-list-item>
              </v-card>
            </v-col>
          </v-row>

          <v-divider class="my-4"></v-divider>

          <v-row>
             <v-col cols="12" md="3">
              <v-text-field
                v-model.number="closeForm.closingBalanceBs"
                label="Saldo Final BS"
                type="number"
                prefix="Bs"
                variant="outlined"
              ></v-text-field>
            </v-col>
            <v-col cols="12" md="3">
              <v-text-field
                v-model.number="closeForm.closingBalanceUsd"
                label="Saldo Final USD"
                type="number"
                prefix="$"
                variant="outlined"
              ></v-text-field>
            </v-col>
            <v-col cols="12" md="4">
              <v-textarea
                v-model="closeForm.notes"
                label="Notas de Cierre (Opcional)"
                rows="1"
                variant="outlined"
              ></v-textarea>
            </v-col>
            <v-col cols="12" md="2" class="d-flex align-center">
              <v-btn color="success" @click="initiateClose" :loading="isReportLoading" block>
                Cerrar Caja
              </v-btn>
            </v-col>
          </v-row>
        </div>
      </div>

      <!-- Report Preview Dialog -->
        <!-- Admin Password Dialog for Cajeros -->
        <v-dialog v-model="showAdminPasswordDialog" persistent max-width="400px">
            <v-card>
                <v-card-title>Confirmar Cierre de Caja</v-card-title>
                <v-card-text>
                    <p class="mb-4">Como cajero, necesitas la contraseña de un administrador para cerrar la caja.</p>
                    <v-text-field
                        v-model="adminPassword"
                        label="Contraseña de Administrador"
                        type="password"
                        variant="outlined"
                        :error-messages="adminPasswordError"
                    ></v-text-field>
                </v-card-text>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn text @click="showAdminPasswordDialog = false">Cancelar</v-btn>
                    <v-btn color="primary" @click="confirmCloseWithAdminPassword" :loading="isLoading">
                        Confirmar
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <!-- Confirmation Dialog for Admin/Dev -->
        <v-dialog v-model="showConfirmationDialog" persistent max-width="400px">
            <v-card>
                <v-card-title>Confirmar Cierre de Caja</v-card-title>
                <v-card-text>
                    <p>¿Estás seguro de que deseas cerrar la caja con estos datos?</p>
                    <v-list dense>
                        <v-list-item :title="formatCurrency(closeForm.closingBalance, 'VES')" subtitle="Saldo Final"></v-list-item>
                        <v-list-item :title="formatCurrency(expectedBalance, 'VES')" subtitle="Saldo Esperado"></v-list-item>
                        <v-list-item v-if="dailyReport && dailyReport.summary" :title="formatCurrency(dailyReport.summary.totalChangeGivenBs || 0, 'VES')" subtitle="Vuelto Total del Día"></v-list-item>
                    </v-list>
                </v-card-text>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn text @click="showConfirmationDialog = false">Cancelar</v-btn>
                    <v-btn color="primary" @click="confirmClose" :loading="isLoading">
                        Confirmar e Imprimir
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <!-- Report Preview Dialog -->
        <v-dialog v-model="showReportDialog" persistent max-width="900px">
            <v-card v-if="dailyReport">
                <v-card-title class="d-flex justify-space-between">
                    <span class="text-h5">Reporte de Cierre de Caja</span>
                    <v-btn icon="mdi-close" variant="text" @click="showReportDialog = false"></v-btn>
                </v-card-title>
                <v-card-text>
                    <div id="printable-report" class="printable-report">
                        <div class="report-header text-center mb-4">
                            <h2>REPORTE DE CIERRE DE CAJA</h2>
                            <p>Lote: {{ dailyReport.reconciliation.lote }}</p>
                        </div>

                        <div class="report-info mb-4">
                            <v-row>
                                <v-col cols="6">
                                    <strong>Usuario:</strong> {{ dailyReport.reconciliation.user.username }}
                                </v-col>
                                <v-col cols="6">
                                    <strong>Fecha de Apertura:</strong> {{ new Date(dailyReport.reconciliation.openingDate).toLocaleString() }}
                                </v-col>
                                <v-col cols="6">
                                    <strong>Fecha de Cierre:</strong> {{ new Date().toLocaleString() }}
                                </v-col>
                                <v-col cols="6">
                                    <strong>Saldo Inicial BS:</strong> {{ formatCurrency(dailyReport.reconciliation.openingBalanceBs, 'VES') }}
                                </v-col>
                                <v-col cols="6">
                                    <strong>Saldo Inicial USD:</strong> {{ formatCurrency(dailyReport.reconciliation.openingBalanceUsd, 'USD') }}
                                </v-col>
                            </v-row>
                        </div>

                        <div class="report-summary mb-4">
                            <h3>RESUMEN FINANCIERO</h3>
                            <v-row>
                                <v-col cols="4"><strong>Total Ventas BS:</strong> {{ formatCurrency(dailyReport.summary.totalSalesBs, 'VES') }}</v-col>
                                <v-col cols="4"><strong>Total Ventas USD:</strong> {{ formatCurrency(dailyReport.summary.totalSalesUsd, 'USD') }}</v-col>
                                <v-col cols="4"><strong>Número de Ventas:</strong> {{ dailyReport.summary.salesCount }}</v-col>
                                <v-col cols="4"><strong>Vuelto Total BS:</strong> {{ formatCurrency(dailyReport.summary.totalChangeGivenBs, 'VES') }}</v-col>
                                <v-col cols="4"><strong>Vuelto Total USD:</strong> {{ formatCurrency(dailyReport.summary.totalChangeGivenUsd, 'USD') }}</v-col>
                                <v-col cols="4"><strong>Saldo Esperado:</strong> {{ formatCurrency(parseFloat(dailyReport.reconciliation.openingBalance) + parseFloat(dailyReport.summary.totalSalesBs) - parseFloat(dailyReport.summary.totalChangeGivenBs || 0), 'VES') }}</v-col>
                            </v-row>
                        </div>

                        <div class="report-breakdown mb-4">
                            <h3>DESGLOSE POR MÉTODO DE PAGO</h3>
                            <v-row>
                                <v-col v-for="(amount, method) in dailyReport.summary.paymentMethodBreakdown" :key="method" cols="6">
                                    <strong>{{ method }}:</strong> {{ formatCurrency(amount, 'VES') }}
                                </v-col>
                            </v-row>
                        </div>

                        <div class="report-sales">
                            <h3>LISTADO DE VENTAS</h3>
                            <table class="sales-table">
                                <thead>
                                    <tr>
                                        <th>Nº Venta</th>
                                        <th>Monto BS</th>
                                        <th>Monto USD</th>
                                        <th>Método</th>
                                        <th>Vuelto BS</th>
                                        <th>Vuelto USD</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="sale in dailyReport.sales" :key="sale.id">
                                        <td>{{ sale.saleNumber }}</td>
                                        <td>{{ formatCurrency(sale.totalBs, 'VES') }}</td>
                                        <td>{{ formatCurrency(sale.totalUsd, 'USD') }}</td>
                                        <td>{{ sale.paymentMethod }}</td>
                                        <td>{{ formatCurrency(sale.changeGivenBs, 'VES') }}</td>
                                        <td>{{ formatCurrency(sale.changeGivenUsd, 'USD') }}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </v-card-text>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn text @click="showReportDialog = false">Cancelar</v-btn>
                    <v-btn color="primary" @click="printReport" :loading="isLoading">
                        <v-icon left>mdi-printer</v-icon>
                        Imprimir Reporte
                    </v-btn>
                    <v-btn color="success" @click="handleConfirmAndPrint" :loading="isLoading">
                        Confirmar e Imprimir
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

    </v-card-text>
  </v-card>
</template>

<script>
import componentLogic from './DailyReconciliation.js'

export default componentLogic
</script>

<style lang="scss" scoped>
@use './DailyReconciliation.scss';
</style>