<template>
  <v-card-text>
    <!-- Filtros para reporte de ajustes -->
    <v-row class="mb-4">
      <v-col cols="12" md="3">
        <v-select
          v-model="filters.type"
          :items="typeOptions"
          label="Tipo de Movimiento"
          density="compact"
          variant="outlined"
        ></v-select>
      </v-col>
      <v-col cols="12" md="3">
        <v-btn @click="loadReport" color="primary" :loading="loading">
          Generar Reporte de Ajustes
        </v-btn>
      </v-col>
      <v-col cols="12" md="3">
        <v-btn @click="exportToExcel" color="success" prepend-icon="mdi-file-excel-outline">
          Exportar Excel
        </v-btn>
      </v-col>
      <v-col cols="12" md="3">
        <v-btn @click="exportToPDF" color="error" prepend-icon="mdi-file-pdf-box">
          Exportar PDF
        </v-btn>
      </v-col>
    </v-row>

    <!-- Tabla de ajustes de inventario -->
    <v-card>
      <v-card-title>
        Reporte de Ajustes de Inventario
        <v-spacer></v-spacer>
        <span class="text-caption">Tasa actual: {{ formatCurrency(currentDolarRate) }} Bs/USD</span>
      </v-card-title>
      <v-data-table
        :headers="headers"
        :items="data"
        :loading="loading"
        item-value="id"
        density="compact"
      >
        <template v-slot:item.totalCostBs="{ item }">
          {{ formatCurrency(item.totalCostBs) }} Bs
        </template>
        <template v-slot:item.totalCostUsd="{ item }">
          {{ formatCurrency(item.totalCostUsd) }} USD
        </template>
      </v-data-table>
    </v-card>
  </v-card-text>
</template>

<script>
import adjustmentsReportLogic from './AdjustmentsReport.js'

export default adjustmentsReportLogic
</script>