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
        <!-- State: No reconciliation open -> Show Open Form -->
        <div v-if="!reconciliation">
          <v-alert type="info" variant="tonal" class="mb-4">
            La caja está cerrada. Ingrese el saldo inicial para comenzar.
          </v-alert>
          <v-row>
            <v-col cols="12" md="4">
              <v-text-field
                v-model.number="openForm.openingBalance"
                label="Saldo Inicial"
                type="number"
                prefix="$"
                variant="outlined"
                autofocus
              ></v-text-field>
            </v-col>
            <v-col cols="12" md="6">
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
                <v-list-item :title="formatCurrency(reconciliation.openingBalance)" subtitle="Saldo Inicial"></v-list-item>
              </v-card>
            </v-col>
            <!-- Sales -->
            <v-col cols="12" md="4">
              <v-card variant="tonal" color="success">
                <v-list-item :title="formatCurrency(reconciliation.totalSales)" subtitle="Ventas del Día"></v-list-item>
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
             <v-col cols="12" md="4">
              <v-text-field
                v-model.number="closeForm.closingBalance"
                label="Saldo Final en Caja"
                type="number"
                prefix="$"
                variant="outlined"
                autofocus
              ></v-text-field>
            </v-col>
            <v-col cols="12" md="6">
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
        <v-dialog v-model="showReportDialog" persistent max-width="800px">
            <v-card v-if="dailyReport">
                <v-card-title class="d-flex justify-space-between">
                    <span class="text-h5">Reporte de Cierre de Caja</span>
                    <v-btn icon="mdi-close" variant="text" @click="showReportDialog = false"></v-btn>
                </v-card-title>
                <v-card-text>
                    <v-row>
                        <v-col cols="6">
                            <v-list-item :title="dailyReport.reconciliation.user.username" subtitle="Usuario"></v-list-item>
                        </v-col>
                        <v-col cols="6">
                            <v-list-item :title="new Date(dailyReport.reconciliation.openingDate).toLocaleString()" subtitle="Fecha de Apertura"></v-list-item>
                        </v-col>
                    </v-row>
                    <v-divider class="my-2"></v-divider>
                    <v-row>
                        <v-col cols="4"><v-list-item :title="formatCurrency(dailyReport.summary.totalSales)" subtitle="Total Ventas"></v-list-item></v-col>
                        <v-col cols="4"><v-list-item :title="dailyReport.summary.salesCount" subtitle="Nº de Ventas"></v-list-item></v-col>
                    </v-row>
                     <v-divider class="my-2"></v-divider>
                     <h3 class="mb-2">Desglose por Método de Pago</h3>
                    <v-row>
                        <v-col v-for="(amount, method) in dailyReport.summary.paymentMethodBreakdown" :key="method" cols="4">
                           <v-list-item :title="formatCurrency(amount)" :subtitle="method"></v-list-item>
                        </v-col>
                    </v-row>
                    <v-divider class="my-2"></v-divider>
                    <h3 class="mb-2">Listado de Ventas</h3>
                    <v-data-table
                        :headers="[{ title: 'Nº Venta', key: 'saleNumber' }, { title: 'Monto', key: 'total' }, { title: 'Método', key: 'paymentMethod' }]"
                        :items="dailyReport.sales"
                        dense
                    >
                      <template v-slot:item.total="{ item }">
                        {{ formatCurrency(item.total) }}
                      </template>
                    </v-data-table>
                </v-card-text>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn text @click="showReportDialog = false">Cancelar</v-btn>
                    <v-btn color="primary" @click="confirmAndPrint" :loading="isLoading">
                        Confirmar e Imprimir
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

    </v-card-text>
  </v-card>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useCashReconciliationStore } from '@/stores/cashReconciliation'
import { storeToRefs } from 'pinia'

// --- Store ---
const store = useCashReconciliationStore()
const { todayReconciliation: reconciliation, dailyReport, isLoading, isReportLoading, error } = storeToRefs(store)

// --- Local State ---
const openForm = ref({ openingBalance: 0, notes: '' })
const closeForm = ref({ closingBalance: 0, notes: '' })
const showReportDialog = ref(false)

// --- Computed ---
const expectedBalance = computed(() => {
  if (!reconciliation.value) return 0
  return parseFloat(reconciliation.value.openingBalance) + parseFloat(reconciliation.value.totalSales)
})

// --- Methods ---
const formatCurrency = (value) => {
  return new Intl.NumberFormat('es-VE', { style: 'currency', currency: 'VES' }).format(value || 0)
}

const handleOpenReconciliation = async () => {
  try {
    await store.openReconciliation(openForm.value)
    openForm.value = { openingBalance: 0, notes: '' }
  } catch (e) {
    console.error('Failed to open reconciliation:', e)
  }
}

const initiateClose = async () => {
  if (!reconciliation.value) return;
  await store.fetchDailyReport(reconciliation.value.id);
  if (store.dailyReport) {
    showReportDialog.value = true;
  }
}

const confirmAndPrint = async () => {
  if (!dailyReport.value) return;

  const { reconciliation: recon, summary, sales } = dailyReport.value;
  let reportText = `
    ======================================
    REPORTE DE CIERRE DE CAJA
    ======================================
    Usuario: ${recon.user.username}
    Fecha de Apertura: ${new Date(recon.openingDate).toLocaleString()}
    Fecha de Cierre:   ${new Date().toLocaleString()}
    --------------------------------------
    RESUMEN FINANCIERO
    --------------------------------------
    Saldo Inicial:      ${formatCurrency(recon.openingBalance)}
    Total de Ventas:    ${formatCurrency(summary.totalSales)}
    --------------------------------------
    Saldo Esperado:     ${formatCurrency(parseFloat(recon.openingBalance) + parseFloat(summary.totalSales))}
    Saldo Final (Contado): ${formatCurrency(closeForm.value.closingBalance)}
    Diferencia:         ${formatCurrency(closeForm.value.closingBalance - (parseFloat(recon.openingBalance) + parseFloat(summary.totalSales)))}
    --------------------------------------
    DESGLOSE DE PAGOS (Total: ${summary.salesCount} ventas)
    --------------------------------------
  `;

  for (const [method, amount] of Object.entries(summary.paymentMethodBreakdown)) {
    reportText += `${method.padEnd(20)}: ${formatCurrency(amount)}\n`;
  }

  reportText += `
    --------------------------------------
    LISTADO DE VENTAS
    --------------------------------------
  `;
  sales.forEach(sale => {
    reportText += `${sale.saleNumber.padEnd(15)} | ${sale.paymentMethod.padEnd(15)} | ${formatCurrency(sale.total)}\n`;
  });
  reportText += "======================================";

  console.log(reportText);

  try {
    await store.closeReconciliation(closeForm.value)
    showReportDialog.value = false
    closeForm.value = { closingBalance: 0, notes: '' }
  } catch (e) {
    console.error('Failed to close reconciliation:', e)
  }
}

// --- Lifecycle ---
onMounted(() => {
  store.fetchTodayReconciliation()
})
</script>