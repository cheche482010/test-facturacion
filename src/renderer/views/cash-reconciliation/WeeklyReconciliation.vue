<template>
  <v-card>
    <v-card-title>Total de Ventas de la Semana</v-card-title>
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
        {{ formatCurrency(weeklyTotalSales) }}
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
const { weeklyReport, isReportLoading, reportError } = storeToRefs(store)

// --- Computed ---
const weeklyTotalSales = computed(() => {
  if (!weeklyReport.value) return 0;
  return weeklyReport.value.reduce((sum, report) => sum + parseFloat(report.totalSales), 0)
})

// --- Methods ---
const formatCurrency = (value) => {
  return new Intl.NumberFormat('es-VE', { style: 'currency', currency: 'VES' }).format(value || 0)
}

// --- Lifecycle ---
onMounted(() => {
  store.fetchWeeklyReport()
})
</script>