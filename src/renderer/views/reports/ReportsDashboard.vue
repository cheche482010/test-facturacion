<template>
  <div>
    <!-- Header -->
    <v-row class="mb-4" align="center" justify="space-between">
      <v-col cols="12" md="auto">
        <h1 class="text-h5 font-weight-bold">Reportes y Análisis</h1>
        <p class="text-medium-emphasis">Genera reportes detallados sobre ventas, inventario y finanzas</p>
      </v-col>
      <v-col cols="12" md="auto">
        <v-row align="center" justify="end">
          <v-col cols="auto">
            <v-text-field
              v-model="startDate"
              label="Fecha Desde"
              type="date"
              density="compact"
              variant="outlined"
              hide-details
              style="min-width: 180px;"
            ></v-text-field>
          </v-col>
          <v-col cols="auto">
            <v-text-field
              v-model="endDate"
              label="Fecha Hasta"
              type="date"
              density="compact"
              variant="outlined"
              hide-details
              style="min-width: 180px;"
            ></v-text-field>
          </v-col>
          <v-col cols="auto">
            <v-btn @click="loadReports">Actualizar</v-btn>
          </v-col>
          <v-col cols="auto">
            <v-btn color="success" prepend-icon="mdi-file-excel-outline">
              Exportar Reporte
            </v-btn>
          </v-col>
        </v-row>
      </v-col>
    </v-row>

    <!-- Tabs for different report categories -->
    <v-card class="mt-4">
      <v-tabs v-model="tab" bg-color="transparent">
        <v-tab value="sales">
          <v-icon start>mdi-chart-bar</v-icon>
          Ventas
        </v-tab>
        <v-tab value="inventory">
          <v-icon start>mdi-package-variant-closed</v-icon>
          Inventario
        </v-tab>
        <v-tab value="finance">
          <v-icon start>mdi-finance</v-icon>
          Financiero
        </v-tab>
      </v-tabs>
      <v-divider></v-divider>

      <v-window v-model="tab">
        <!-- Sales Tab -->
        <v-window-item value="sales">
          <v-card-text>
            <!-- Sales Summary Cards -->
            <v-row>
              <v-col v-for="card in salesSummaryCards" :key="card.title" cols="12" sm="6" md="3">
                <v-card variant="tonal" :color="card.color">
                  <v-card-text class="d-flex align-center">
                    <v-icon :icon="card.icon" size="32" class="mr-4" />
                    <div>
                      <p class="text-h6 font-weight-bold">{{ card.value }}</p>
                      <p>{{ card.title }}</p>
                    </div>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>

            <!-- Charts -->
            <v-row class="mt-4">
              <v-col cols="12" md="6">
                <v-card>
                  <v-card-item><v-card-title>Ventas por Día</v-card-title></v-card-item>
                  <div style="height: 300px;" class="d-flex align-center justify-center text-medium-emphasis bg-grey-lighten-4 rounded ma-4">
                    <!-- Placeholder for daily sales chart -->
                    <p>Gráfico de ventas por día</p>
                  </div>
                </v-card>
              </v-col>
              <v-col cols="12" md="6">
                <v-card>
                  <v-card-item><v-card-title>Ventas por Método de Pago</v-card-title></v-card-item>
                   <div style="height: 300px;" class="d-flex align-center justify-center text-medium-emphasis bg-grey-lighten-4 rounded ma-4">
                    <!-- Placeholder for payment method chart -->
                    <p>Gráfico de ventas por método de pago</p>
                  </div>
                </v-card>
              </v-col>
            </v-row>

            <!-- Top Selling Products Table -->
            <v-card class="mt-4">
              <v-card-item><v-card-title>Productos Más Vendidos</v-card-title></v-card-item>
              <v-data-table
                :headers="topProductsHeaders"
                :items="topProducts"
                :loading="loading"
                item-value="id"
              ></v-data-table>
            </v-card>
          </v-card-text>
        </v-window-item>

        <!-- Other Tabs Placeholders -->
        <v-window-item value="inventory">
          <p class="text-center py-8 text-medium-emphasis">Reportes de inventario.</p>
        </v-window-item>
        <v-window-item value="finance">
          <p class="text-center py-8 text-medium-emphasis">Reportes financieros.</p>
        </v-window-item>
      </v-window>
    </v-card>
  </div>
</template>

<script>
import reportsDashboardLogic from './ReportsDashboard.js'

export default reportsDashboardLogic
</script>
