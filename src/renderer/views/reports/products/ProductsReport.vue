<template>
  <v-card-text>
    <!-- Filtros para reporte de productos -->
    <v-row class="mb-4">
      <v-col cols="12" md="3">
        <v-select
          v-model="filters.complete"
          :items="completeOptions"
          label="Tipo de Reporte"
          density="compact"
          variant="outlined"
        ></v-select>
      </v-col>

      <!-- Filtros detallados - solo visibles cuando es "Detallado" -->
      <template v-if="filters.complete === 'false'">
        <v-col cols="12" md="2">
          <v-select
            v-model="filters.category"
            :items="categoryOptions"
            label="Categoría"
            density="compact"
            variant="outlined"
            clearable
          ></v-select>
        </v-col>
        <v-col cols="12" md="2">
          <v-select
            v-model="filters.status"
            :items="statusOptions"
            label="Estado"
            density="compact"
            variant="outlined"
          ></v-select>
        </v-col>
        <v-col cols="12" md="2">
          <v-select
            v-model="filters.stockFilter"
            :items="stockFilterOptions"
            label="Filtro de Stock"
            density="compact"
            variant="outlined"
          ></v-select>
        </v-col>
      </template>

      <v-col :cols="filters.complete === 'false' ? 3 : 6" md="3">
        <v-btn @click="loadReport" color="primary" :loading="loading" block>
          Generar Reporte
        </v-btn>
      </v-col>
      <v-col :cols="filters.complete === 'false' ? 3 : 6" md="3">
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

    <!-- Tabla de productos -->
    <v-card>
      <v-card-title>
        Reporte de Inventario por Productos
        <v-spacer></v-spacer>
        <div class="text-caption">
          <div>Tasa actual: {{ formatCurrency(currentDolarRate) }} Bs/USD</div>
          <div v-if="filters.complete === 'true'">Reporte completo de todos los productos</div>
          <div v-else>Filtros aplicados: {{ getActiveFiltersText() }}</div>
        </div>
      </v-card-title>
      <v-data-table
        :headers="headers"
        :items="data"
        :loading="loading"
        item-value="id"
        density="compact"
      >
        <template v-slot:item.status="{ item }">
          <v-chip
            :color="getStatusColor(item.status)"
            size="small"
          >
            {{ getStatusText(item.status) }}
          </v-chip>
        </template>
        <template v-slot:item.currentStock="{ item }">
          <v-chip
            :color="item.stockColor || getStockColor(item.currentStock)"
            size="small"
          >
            {{ item.currentStock }}
          </v-chip>
        </template>
        <template v-slot:item.retailPriceUsd="{ item }">
          $ {{ item.retailPriceUsd }} USD
        </template>
        <template v-slot:item.totalValueUsd="{ item }">
          $ {{ item.totalValueUsd }} USD
        </template>
        <template v-slot:item.retailPriceBs="{ item }">
          {{ formatCurrency(item.retailPriceBs) }} Bs
        </template>
        <template v-slot:item.totalValueBs="{ item }">
          {{ formatCurrency(item.totalValueBs) }} Bs
        </template>
      </v-data-table>
    </v-card>
  </v-card-text>
</template>

<script>
import productsReportLogic from './ProductsReport.js'

export default productsReportLogic
</script>