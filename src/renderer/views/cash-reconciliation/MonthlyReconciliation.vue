<template>
  <v-card>
    <v-card-title>Total de Ventas del Mes</v-card-title>
    <v-card-text>
      <!-- Loading Indicator -->
      <div v-if="isReportLoading" class="text-center">
        <v-progress-circular indeterminate color="primary" size="32"></v-progress-circular>
      </div>

      <!-- Error Display -->
      <v-alert v-else-if="reportError" type="error" variant="tonal" dense>
        {{ reportError }}
      </v-alert>

      <!-- Main Content -->
      <p v-else class="text-h4 text-success">
        {{ formatCurrency(monthlyTotalSales) }}
      </p>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { onMounted, computed } from 'vue'
import { useCashReconciliationStore } from '@/stores/cashReconciliation'
import { storeToRefs } from 'pinia'

// --- Store ---
const store = useCashReconciliationStore()
const { monthlyReport, isReportLoading, reportError } = storeToRefs(store)

// --- Computed ---
const monthlyTotalSales = computed(() => {
  if (!monthlyReport.value) return 0;
  return monthlyReport.value.reduce((sum, report) => sum + parseFloat(report.totalSales), 0)
})

// --- Methods ---
const formatCurrency = (value) => {
  return new Intl.NumberFormat('es-VE', { style: 'currency', currency: 'VES' }).format(value || 0)
}

// --- Lifecycle ---
onMounted(() => {
  store.fetchMonthlyReport()
})
</script>