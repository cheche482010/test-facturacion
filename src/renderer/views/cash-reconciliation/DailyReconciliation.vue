<template>
  <v-card flat>
    <v-card-text>
      <!-- Loading Indicator -->
      <div v-if="isLoading" class="text-center pa-4">
        <v-progress-circular indeterminate color="primary"></v-progress-circular>
        <p class="mt-2">Cargando información del arqueo...</p>
      </div>

      <!-- Error Display -->
      <v-alert v-if="error" type="error" variant="tonal" closable class="mb-4">
        {{ error }}
      </v-alert>

      <!-- Main Content -->
      <div v-if="!isLoading">
        <!-- State: No reconciliation open -->
        <div v-if="!reconciliation">
          <v-alert type="info" variant="tonal" class="mb-4">
            No hay una caja abierta para el día de hoy.
          </v-alert>
          <v-btn color="primary" @click="showOpenDialog = true">
            <v-icon start>mdi-cash-plus</v-icon>
            Abrir Caja
          </v-btn>
        </div>

        <!-- State: Reconciliation is open -->
        <div v-else>
          <v-row>
            <v-col cols="12" md="6">
              <v-card variant="outlined">
                <v-card-title>Información del Arqueo</v-card-title>
                <v-list-item :title="reconciliation.user.username" subtitle="Abierta por"></v-list-item>
                <v-list-item :title="new Date(reconciliation.openingDate).toLocaleString()" subtitle="Fecha de Apertura"></v-list-item>
                <v-list-item :title="formatCurrency(reconciliation.openingBalance)" subtitle="Saldo Inicial" class="font-weight-bold"></v-list-item>
              </v-card>
            </v-col>

            <v-col cols="12" md="6">
              <v-card variant="outlined">
                <v-card-title>Resumen de Ventas (Hasta Ahora)</v-card-title>
                 <v-list-item :title="formatCurrency(reconciliation.totalSales)" subtitle="Total de Ventas" class="font-weight-bold text-success"></v-list-item>
                 <v-list-item :title="reconciliation.salesCount" subtitle="Número de Ventas"></v-list-item>
              </v-card>
            </v-col>
          </v-row>

          <v-divider class="my-4"></v-divider>

          <v-btn color="success" @click="showCloseDialog = true" :disabled="!reconciliation">
            <v-icon start>mdi-cash-check</v-icon>
            Cerrar Caja
          </v-btn>
        </div>
      </div>

      <!-- Dialog for Opening Reconciliation -->
      <v-dialog v-model="showOpenDialog" persistent max-width="500px">
        <v-card>
          <v-card-title>Abrir Caja</v-card-title>
          <v-card-text>
            <v-text-field
              v-model.number="openForm.openingBalance"
              label="Saldo Inicial"
              type="number"
              prefix="$"
              variant="outlined"
              autofocus
            ></v-text-field>
            <v-textarea
              v-model="openForm.notes"
              label="Notas (Opcional)"
              rows="3"
              variant="outlined"
            ></v-textarea>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn text @click="showOpenDialog = false">Cancelar</v-btn>
            <v-btn color="primary" @click="handleOpenReconciliation" :loading="isLoading">Confirmar Apertura</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Dialog for Closing Reconciliation -->
      <v-dialog v-model="showCloseDialog" persistent max-width="500px">
        <v-card>
          <v-card-title>Cerrar Caja</v-card-title>
          <v-card-text>
            <p class="mb-4">Confirma el monto final en caja para realizar el cierre.</p>
            <v-text-field
              v-model.number="closeForm.closingBalance"
              label="Saldo Final en Caja"
              type="number"
              prefix="$"
              variant="outlined"
              autofocus
            ></v-text-field>
            <v-textarea
              v-model="closeForm.notes"
              label="Notas de Cierre (Opcional)"
              rows="3"
              variant="outlined"
            ></v-textarea>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn text @click="showCloseDialog = false">Cancelar</v-btn>
            <v-btn color="success" @click="handleCloseReconciliation" :loading="isLoading">Confirmar Cierre</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

    </v-card-text>
  </v-card>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useCashReconciliationStore } from '@/stores/cashReconciliation'
import { storeToRefs } from 'pinia'

// --- Store ---
const store = useCashReconciliationStore()
const { todayReconciliation: reconciliation, isLoading, error } = storeToRefs(store)

// --- Local State for Dialogs and Forms ---
const showOpenDialog = ref(false)
const showCloseDialog = ref(false)
const openForm = ref({
  openingBalance: 0,
  notes: '',
})
const closeForm = ref({
  closingBalance: 0,
  notes: '',
})

// --- Methods ---
const formatCurrency = (value) => {
  return new Intl.NumberFormat('es-VE', { style: 'currency', currency: 'VES' }).format(value || 0)
}

const handleOpenReconciliation = async () => {
  try {
    await store.openReconciliation(openForm.value)
    showOpenDialog.value = false
    openForm.value = { openingBalance: 0, notes: '' } // Reset form
  } catch (e) {
    console.error('Failed to open reconciliation:', e)
  }
}

const handleCloseReconciliation = async () => {
  if (!reconciliation.value) return
  try {
    await store.closeReconciliation(closeForm.value)
    showCloseDialog.value = false
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