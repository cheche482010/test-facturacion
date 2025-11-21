<template>
  <v-card-text>
    <!-- Filtros para reporte financiero -->
    <v-row class="mb-4">
      <v-col cols="12" md="3">
        <v-text-field
          v-model="filters.date"
          label="Fecha específica"
          type="date"
          density="compact"
          variant="outlined"
        ></v-text-field>
      </v-col>
      <v-col cols="12" md="3">
        <v-btn @click="loadReport" color="primary" :loading="loading">
          Generar Reporte Financiero
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

    <!-- Tabla de ventas financieras -->
    <v-card>
      <v-card-title>
        Reporte Financiero de Ventas
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
        <template v-slot:item.totalBs="{ item }">
          {{ formatCurrency(item.totalBs) }} Bs
        </template>
        <template v-slot:item.totalUsd="{ item }">
          {{ formatCurrency(item.totalUsd) }} USD
        </template>
        <template v-slot:item.dolarRateAtSale="{ item }">
          {{ formatCurrency(item.dolarRateAtSale) }}
        </template>
      </v-data-table>
    </v-card>
  </v-card-text>
</template>

<script>
import financeReportLogic from './FinanceReport.js'

export default financeReportLogic
</script>