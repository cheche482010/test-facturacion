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

    <!-- Opciones de exportación -->
    <v-row v-if="movements && movements.length > 0" class="mb-4">
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

    <v-card>
      <v-card-title>
        Reporte de Movimientos de Inventario
        <v-spacer></v-spacer>
        <span class="text-caption">Tasa actual: {{ formatCurrency(currentDolarRate) }} Bs/USD</span>
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
          <v-chip :color="item.movementType === 'entrada' ? 'success' : 'error'" size="small">
            <span class="font-weight-bold">{{ item.movementType === 'entrada' ? '+' : '-' }}{{ Math.round(item.quantity) }}</span>
          </v-chip>
        </template>
        <template v-slot:item.movementType="{ item }">
          <v-chip size="small">{{ item.movementType }}</v-chip>
        </template>
        <template v-slot:item.saleNumber="{ item }">
          <span v-if="item.saleNumber">{{ item.saleNumber }}</span>
          <span v-else class="text-caption text-medium-emphasis">-</span>
        </template>
      </v-data-table>
    </v-card>
  </v-card-text>
</template>

<script>
import inventoryReportLogic from './InventoryReport.js'

export default inventoryReportLogic
</script>