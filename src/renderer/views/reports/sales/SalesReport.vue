<template>
  <v-card-text>
    <!-- Filtros para reporte de ventas -->
    <v-row class="mb-4">
      <v-col cols="12" md="2">
        <v-text-field
          v-model="filters.startDate"
          label="Fecha Desde"
          type="date"
          density="compact"
          variant="outlined"
        ></v-text-field>
      </v-col>
      <v-col cols="12" md="2">
        <v-text-field
          v-model="filters.endDate"
          label="Fecha Hasta"
          type="date"
          density="compact"
          variant="outlined"
        ></v-text-field>
      </v-col>
      <v-col cols="12" md="2">
        <v-text-field
          v-model="filters.batch"
          label="Lote (opcional)"
          density="compact"
          variant="outlined"
          clearable
        ></v-text-field>
      </v-col>
      <v-col cols="12" md="2">
        <v-btn @click="loadReport" color="primary" :loading="loading" block>
          Generar Reporte
        </v-btn>
      </v-col>
      <v-col cols="12" md="2">
        <v-btn @click="loadAllReport" color="info" :loading="loading" block>
          Todas las Ventas
        </v-btn>
      </v-col>
      <v-col cols="12" md="2">
        <v-row>
          <v-col cols="6">
            <v-btn @click="exportToExcel" color="success" size="small" prepend-icon="mdi-file-excel-outline">
              Excel
            </v-btn>
          </v-col>
          <v-col cols="6">
            <v-btn @click="exportToPDF" color="error" size="small" prepend-icon="mdi-file-pdf-box">
              PDF
            </v-btn>
          </v-col>
        </v-row>
      </v-col>
    </v-row>

    <!-- Tabla de ventas detalladas -->
    <v-card>
      <v-card-title>
        Reporte de Ventas
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
        <template v-slot:item.userName="{ item }">
          {{ item.user.first_name }} {{ item.user.last_name }}
        </template>
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
import salesReportLogic from './SalesReport.js'

export default salesReportLogic
</script>