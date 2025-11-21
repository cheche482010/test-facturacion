<template>
  <v-card-text>
    <!-- Filtros para reporte de inventario -->
    <v-row class="mb-4">
      <v-col cols="12" md="3">
        <v-select
          v-model="filters.status"
          :items="statusOptions"
          label="Estado de Stock"
          density="compact"
          variant="outlined"
        ></v-select>
      </v-col>
      <v-col cols="12" md="3">
        <v-btn @click="loadReport" color="primary" :loading="loading">
          Generar Reporte de Inventario
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

    <!-- Tabla de inventario detallado -->
    <v-card>
      <v-card-title>
        Reporte de Inventario
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
        <template v-slot:item.currentStock="{ item }">
          <v-chip :color="item.stockColor" size="small">
            {{ item.currentStock }}
          </v-chip>
        </template>
        <template v-slot:item.retailPriceBs="{ item }">
          {{ formatCurrency(item.retailPriceBs) }} Bs
        </template>
        <template v-slot:item.retailPriceUsd="{ item }">
          {{ formatCurrency(item.retailPriceUsd) }} USD
        </template>
      </v-data-table>
    </v-card>
  </v-card-text>
</template>

<script>
import inventoryReportLogic from './InventoryReport.js'

export default inventoryReportLogic
</script>