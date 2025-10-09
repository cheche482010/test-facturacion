<template>
  <v-container fluid>
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-icon start>mdi-cash-register</v-icon>
        Arqueo de Caja
      </v-card-title>
      <v-card-subtitle>Gestión de cierres de caja diarios, semanales y mensuales.</v-card-subtitle>

      <v-tabs v-model="tab" bg-color="primary">
        <v-tab value="today">Cierre del Día</v-tab>
        <v-tab value="weekly">Resumen Semanal</v-tab>
        <v-tab value="monthly">Resumen Mensual</v-tab>
      </v-tabs>

      <v-card-text>
        <v-window v-model="tab">
          <v-window-item value="today">
            <DailyReconciliation />
          </v-window-item>
          <v-window-item value="weekly">
            <WeeklyReconciliation />
          </v-window-item>
          <v-window-item value="monthly">
            <MonthlyReconciliation />
          </v-window-item>
        </v-window>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref } from 'vue'
import DailyReconciliation from './DailyReconciliation.vue'
import WeeklyReconciliation from './WeeklyReconciliation.vue'
import MonthlyReconciliation from './MonthlyReconciliation.vue'

const tab = ref('today')
</script>

<style scoped>
/* Add any specific styles for this view here */
</style>