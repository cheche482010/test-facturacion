<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title class="d-flex align-center">
            <v-icon start>mdi-cash-register</v-icon>
            Arqueo de Caja
          </v-card-title>
          <v-card-subtitle>
            Gestión de cierres de caja y visualización de totales.
          </v-card-subtitle>
        </v-card>
      </v-col>
    </v-row>

    <v-row>
      <!-- Weekly Summary -->
      <v-col cols="12" md="6">
        <WeeklyReconciliation />
      </v-col>

      <!-- Monthly Summary -->
      <v-col cols="12" md="6">
        <MonthlyReconciliation />
      </v-col>
    </v-row>

    <v-row>
      <!-- Daily Reconciliation -->
      <v-col cols="12">
        <DailyReconciliation />
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import DailyReconciliation from './DailyReconciliation.vue'
import WeeklyReconciliation from './WeeklyReconciliation.vue'
import MonthlyReconciliation from './MonthlyReconciliation.vue'
</script>

<style scoped>
/* Add any specific styles for this view here */
</style>