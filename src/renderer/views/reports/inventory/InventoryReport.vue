<template>
  <v-card-text>
    <!-- Filtros en tiempo real -->
    <v-card variant="outlined" class="mb-4">
      <v-card-title class="text-subtitle-1 font-weight-bold">
        <v-icon class="me-2">mdi-filter-variant</v-icon>
        Filtros de Movimientos de Inventario
      </v-card-title>
      <v-card-text>
        <v-row>
          <v-col cols="12" md="3">
            <v-text-field
              type="date"
              v-model="filters.startDate"
              label="Fecha de Inicio"
              density="compact"
              variant="outlined"
            ></v-text-field>
          </v-col>
          <v-col cols="12" md="3">
            <v-text-field
              type="date"
              v-model="filters.endDate"
              label="Fecha de Fin"
              density="compact"
              variant="outlined"
            ></v-text-field>
          </v-col>
          <v-col cols="12" md="3">
            <v-text-field
              v-model="filters.searchTerm"
              label="Buscar Producto"
              density="compact"
              variant="outlined"
              clearable
              placeholder="Escribe para buscar..."
            ></v-text-field>
          </v-col>
          <v-col cols="12" md="2">
            <v-select
              v-model="filters.movementType"
              :items="movementTypeOptions"
              label="Tipo de Movimiento"
              density="compact"
              variant="outlined"
            ></v-select>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <v-card>
      <v-card-title>
        Reporte de Movimientos de Inventario
        <v-spacer></v-spacer>
        <span class="text-caption">Tasa actual: {{ formatCurrency(currentDolarRate) }} Bs/USD</span>
        <v-spacer></v-spacer>
        <v-btn @click="exportToExcel" color="success" prepend-icon="mdi-file-excel-outline" class="me-2">
          Excel
        </v-btn>
        <v-btn @click="exportToPDF" color="error" prepend-icon="mdi-file-pdf-box">
          PDF
        </v-btn>
      </v-card-title>
      <v-data-table
        :headers="headers"
        :items="movements"
        :loading="loading"
        item-value="id"
        density="compact"
      >
        <template v-slot:item.movementDate="{ item }">
          {{ new Date(item.movementDate).toLocaleString() }}
        </template>
        <template v-slot:item.quantity="{ item }">
          <v-chip :color="item.quantity > 0 ? 'success' : 'error'" size="small">
            <span class="font-weight-bold">{{ item.quantity > 0 ? '+' : '' }}{{ item.quantity }}</span>
          </v-chip>
        </template>
        <template v-slot:item.movementType="{ item }">
          <v-chip size="small">{{ item.movementType }}</v-chip>
        </template>
      </v-data-table>
    </v-card>
  </v-card-text>
</template>

<script>
import inventoryReportLogic from './InventoryReport.js'

export default inventoryReportLogic
</script>