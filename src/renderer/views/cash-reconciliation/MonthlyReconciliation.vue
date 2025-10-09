<template>
  <v-card flat>
    <v-card-text>
      <!-- Loading Indicator -->
      <div v-if="isReportLoading" class="text-center pa-4">
        <v-progress-circular indeterminate color="primary"></v-progress-circular>
        <p class="mt-2">Cargando reporte mensual...</p>
      </div>

      <!-- Error Display -->
      <v-alert v-else-if="reportError" type="error" variant="tonal" closable class="mb-4">
        {{ reportError }}
      </v-alert>

      <!-- Main Content -->
      <div v-else>
        <v-card variant="outlined" class="mb-4">
            <v-card-title>Total de Ventas del Mes</v-card-title>
            <v-card-text class="text-h4 text-success">
                {{ formatCurrency(monthlyTotalSales) }}
            </v-card-text>
        </v-card>

        <v-data-table
          :headers="headers"
          :items="monthlyReport"
          item-key="id"
          class="elevation-1"
          no-data-text="No hay arqueos cerrados en este mes."
        >
          <template v-slot:item.closingDate="{ item }">
            {{ new Date(item.closingDate).toLocaleDateString() }}
          </template>
          <template v-slot:item.totalSales="{ item }">
            {{ formatCurrency(item.totalSales) }}
          </template>
           <template v-slot:item.openingBalance="{ item }">
            {{ formatCurrency(item.openingBalance) }}
          </template>
          <template v-slot:item.closingBalance="{ item }">
            {{ formatCurrency(item.closingBalance) }}
          </template>
          <template v-slot:item.difference="{ item }">
            <span :class="getDifferenceClass(item)">
              {{ formatCurrency(calculateDifference(item)) }}
            </span>
          </template>
        </v-data-table>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useCashReconciliationStore } from '@/stores/cashReconciliation'
import { storeToRefs } from 'pinia'

// --- Store ---
const store = useCashReconciliationStore()
const { monthlyReport, isReportLoading, reportError } = storeToRefs(store)

// --- Local State ---
const headers = ref([
  { title: 'Fecha de Cierre', key: 'closingDate', align: 'start' },
  { title: 'Saldo Inicial', key: 'openingBalance', align: 'end' },
  { title: 'Ventas del Día', key: 'totalSales', align: 'end' },
  { title: 'Saldo Final (Contado)', key: 'closingBalance', align: 'end' },
  { title: 'Diferencia', key: 'difference', align: 'end' },
])

// --- Computed ---
const monthlyTotalSales = computed(() => {
  return monthlyReport.value.reduce((sum, report) => sum + parseFloat(report.totalSales), 0)
})

// --- Methods ---
const formatCurrency = (value) => {
  return new Intl.NumberFormat('es-VE', { style: 'currency', currency: 'VES' }).format(value || 0)
}

const calculateDifference = (item) => {
    const expected = parseFloat(item.openingBalance) + parseFloat(item.totalSales);
    const actual = parseFloat(item.closingBalance);
    return actual - expected;
}

const getDifferenceClass = (item) => {
    const difference = calculateDifference(item);
    if (difference < 0) return 'text-error';
    if (difference > 0) return 'text-warning';
    return 'text-success';
}

// --- Lifecycle ---
onMounted(() => {
  store.fetchMonthlyReport()
})
</script>