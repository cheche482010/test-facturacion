<template>
  <div>
    <v-row class="mb-4">
      <v-col>
        <h2>Dashboard de Reportes</h2>
      </v-col>
      <v-col cols="auto">
        <v-btn color="primary" @click="refreshData">
          <v-icon left>mdi-refresh</v-icon>
          Actualizar
        </v-btn>
      </v-col>
    </v-row>

    <!-- Summary Cards -->
    <v-row class="mb-6">
      <v-col cols="12" md="3">
        <v-card color="primary" dark>
          <v-card-text>
            <div class="text-h4">${{ formatCurrency(dashboardData.todaySales?.total || 0) }}</div>
            <div>Ventas de Hoy</div>
            <div class="text-caption">{{ dashboardData.todaySales?.count || 0 }} transacciones</div>
          </v-card-text>
        </v-card>
      </v-col>
      
      <v-col cols="12" md="3">
        <v-card color="success" dark>
          <v-card-text>
            <div class="text-h4">${{ formatCurrency(dashboardData.monthlySales?.total || 0) }}</div>
            <div>Ventas del Mes</div>
            <div class="text-caption">{{ dashboardData.monthlySales?.count || 0 }} transacciones</div>
          </v-card-text>
        </v-card>
      </v-col>
      
      <v-col cols="12" md="3">
        <v-card color="warning" dark>
          <v-card-text>
            <div class="text-h4">{{ dashboardData.lowStockProducts?.length || 0 }}</div>
            <div>Stock Bajo</div>
            <div class="text-caption">Productos por reabastecer</div>
          </v-card-text>
        </v-card>
      </v-col>
      
      <v-col cols="12" md="3">
        <v-card color="info" dark>
          <v-card-text>
            <div class="text-h4">{{ dashboardData.topProducts?.length || 0 }}</div>
            <div>Productos Top</div>
            <div class="text-caption">Más vendidos del mes</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row>
      <!-- Sales Chart -->
      <v-col cols="12" md="8">
        <v-card>
          <v-card-title>Ventas de los Últimos 7 Días</v-card-title>
          <v-card-text>
            <canvas ref="salesChart" height="300"></canvas>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Top Products -->
      <v-col cols="12" md="4">
        <v-card>
          <v-card-title>Productos Más Vendidos</v-card-title>
          <v-card-text>
            <v-list dense>
              <v-list-item
                v-for="product in dashboardData.topProducts"
                :key="product.productId"
              >
                <v-list-item-content>
                  <v-list-item-title>{{ product.Product.name }}</v-list-item-title>
                  <v-list-item-subtitle>
                    {{ product.totalSold }} vendidos - ${{ formatCurrency(product.totalRevenue) }}
                  </v-list-item-subtitle>
                </v-list-item-content>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row class="mt-4">
      <!-- Low Stock Alert -->
      <v-col cols="12" md="6">
        <v-card>
          <v-card-title class="warning--text">
            <v-icon color="warning" class="mr-2">mdi-alert</v-icon>
            Stock Bajo
          </v-card-title>
          <v-card-text>
            <v-list dense>
              <v-list-item
                v-for="product in dashboardData.lowStockProducts"
                :key="product.id"
              >
                <v-list-item-content>
                  <v-list-item-title>{{ product.name }}</v-list-item-title>
                  <v-list-item-subtitle>
                    Stock: {{ product.stock }} / Mínimo: {{ product.minStock }}
                  </v-list-item-subtitle>
                </v-list-item-content>
                <v-list-item-action>
                  <v-chip small color="warning">
                    {{ product.stock }}
                  </v-chip>
                </v-list-item-action>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Quick Actions -->
      <v-col cols="12" md="6">
        <v-card>
          <v-card-title>Reportes Rápidos</v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="6">
                <v-btn block color="primary" @click="$router.push('/reports/sales')">
                  <v-icon left>mdi-chart-line</v-icon>
                  Ventas
                </v-btn>
              </v-col>
              <v-col cols="6">
                <v-btn block color="success" @click="$router.push('/reports/inventory')">
                  <v-icon left>mdi-package-variant</v-icon>
                  Inventario
                </v-btn>
              </v-col>
              <v-col cols="6">
                <v-btn block color="info" @click="$router.push('/reports/products')">
                  <v-icon left>mdi-star</v-icon>
                  Productos
                </v-btn>
              </v-col>
              <v-col cols="6">
                <v-btn block color="orange" @click="$router.push('/reports/financial')">
                  <v-icon left>mdi-currency-usd</v-icon>
                  Financiero
                </v-btn>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script>
import reportsDashboardLogic from './Dashboard.js'

export default reportsDashboardLogic
</script>
