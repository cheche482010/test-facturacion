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
              <v-btn color="success" @click="handleCloseReconciliation" :loading="isLoading" block>
                Cerrar Caja
              </v-btn>
            </v-col>
          </v-row>
        </div>
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
const { todayReconciliation: reconciliation, isLoading, error } = storeToRefs(store)

// --- Local State for Forms ---
const openForm = ref({
  openingBalance: 0,
  notes: '',
})
const closeForm = ref({
  closingBalance: 0,
  notes: '',
})

// --- Computed ---
const expectedBalance = computed(() => {
  if (!reconciliation.value) return 0;
  return parseFloat(reconciliation.value.openingBalance) + parseFloat(reconciliation.value.totalSales);
})

// --- Methods ---
const formatCurrency = (value) => {
  return new Intl.NumberFormat('es-VE', { style: 'currency', currency: 'VES' }).format(value || 0)
}

const handleOpenReconciliation = async () => {
  try {
    await store.openReconciliation(openForm.value)
    openForm.value = { openingBalance: 0, notes: '' } // Reset form
  } catch (e) {
    console.error('Failed to open reconciliation:', e)
  }
}

const handleCloseReconciliation = async () => {
  if (!reconciliation.value) return
  try {
    await store.closeReconciliation(closeForm.value)
    closeForm.value = { closingBalance: 0, notes: '' } // Reset form
  } catch (e) {
    console.error('Failed to close reconciliation:', e)
  }
}

// --- Lifecycle ---
onMounted(() => {
  store.fetchTodayReconciliation()
})
</script>