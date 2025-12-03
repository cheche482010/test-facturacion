<template>
  <v-card-text>
    <!-- Filtros para reporte de productos -->
    <v-card variant="outlined" class="mb-4">
      <v-card-title class="text-subtitle-1 font-weight-bold">
        <v-icon class="me-2">mdi-filter-variant</v-icon>
        Filtros de Reporte de Productos
      </v-card-title>
      <v-card-text>
        <v-row>
          <v-col cols="12" md="3">
            <v-select
              v-model="filters.category"
              :items="categoryOptions"
              label="Categoría"
              density="compact"
              variant="outlined"
              clearable
            ></v-select>
          </v-col>
          <v-col cols="12" md="3">
            <v-select
              v-model="filters.status"
              :items="statusOptions"
              label="Estado"
              density="compact"
              variant="outlined"
            ></v-select>
          </v-col>
          <v-col cols="12" md="3">
            <v-select
              v-model="filters.stockFilter"
              :items="stockFilterOptions"
              label="Filtro de Stock"
              density="compact"
              variant="outlined"
            ></v-select>
          </v-col>
          <v-col cols="12" md="3">
            <v-btn @click="clearFilters" color="secondary" variant="outlined" block>
              <v-icon class="me-2">mdi-filter-off</v-icon>
              Limpiar Filtros
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Opciones de exportación -->
    <v-row v-if="data && data.length > 0" class="mb-4">
      <v-col cols="12">
        <v-card variant="outlined" class="pa-4">
          <v-card-title class="text-subtitle-1 font-weight-bold pa-0 mb-3">
            <v-icon class="me-2">mdi-download</v-icon>
            Exportar Reporte
          </v-card-title>
          <v-card-text class="pa-0">
            <v-row>
              <!-- Selección de formatos -->
              <v-col cols="12" md="8">
                <div class="text-body-2 font-weight-medium mb-2">Formatos de Exportación</div>
                <v-checkbox v-model="exportOptions.formats.excel" label="Excel (.xlsx)" class="mb-1"></v-checkbox>
                <v-checkbox v-model="exportOptions.formats.pdf" label="PDF (.pdf)" class="mb-1"></v-checkbox>
              </v-col>

              <!-- Botón de exportar -->
              <v-col cols="12" md="4" class="d-flex align-center">
                <v-btn @click="exportReport" color="primary" :disabled="!canExport" block prepend-icon="mdi-download">
                  Exportar
                </v-btn>
              </v-col>
            </v-row>

            <!-- Mensaje de validación -->
            <v-alert v-if="!canExport" type="info" density="compact" class="mt-3 mb-0">
              Selecciona al menos un formato de exportación
            </v-alert>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Tabla de productos -->
    <v-card>
      <v-card-title>
        Reporte de Inventario por Productos ({{ filteredData.length }} productos)
        <v-spacer></v-spacer>
        <div class="text-caption">
          <div>Tasa actual: {{ formatCurrency(currentDolarRate) }} Bs/USD</div>
          <div>Filtros aplicados: {{ getActiveFiltersText() }}</div>
        </div>
      </v-card-title>
      <v-data-table
        :headers="headers"
        :items="filteredData"
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