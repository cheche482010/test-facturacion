<template>
  <div>
    <!-- Header -->
    <v-row class="mb-4">
      <v-col>
        <h1 class="text-h5 font-weight-bold">Reportes y Análisis</h1>
        <p class="text-medium-emphasis">Genera reportes detallados sobre ventas, inventario y finanzas</p>
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
        <v-tab value="products">
          <v-icon start>mdi-tag-multiple</v-icon>
          Productos
        </v-tab>
      </v-tabs>
      <v-divider></v-divider>

      <v-window v-model="tab">
        <!-- Sales Tab -->
        <v-window-item value="sales">
          <SalesReport
            :start-date="startDate"
            :end-date="endDate"
            :current-dolar-rate="currentDolarRate"
          />
        </v-window-item>

        <!-- Inventory Tab -->
        <v-window-item value="inventory">
          <InventoryReport :current-dolar-rate="currentDolarRate" />
        </v-window-item>


        <!-- Products Tab -->
        <v-window-item value="products">
          <ProductsReport :current-dolar-rate="currentDolarRate" />
        </v-window-item>

      </v-window>
    </v-card>
  </div>
</template>

<script>
import SalesReport from './sales/SalesReport.vue'
import InventoryReport from './inventory/InventoryReport.vue'
import ProductsReport from './products/ProductsReport.vue'
import reportsDashboardLogic from './ReportsDashboard.js'

export default {
  ...reportsDashboardLogic,
  components: {
    SalesReport,
    InventoryReport,
    ProductsReport
  }
}
</script>
