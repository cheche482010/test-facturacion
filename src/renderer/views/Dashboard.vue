<template>
  <div>
    <!-- Header -->
    <div class="d-flex justify-space-between align-center mb-4">
      <div>
        <h1 class="text-h5 font-weight-bold">Dashboard</h1>
        <p class="text-medium-emphasis">{{ formattedDate }}</p>
      </div>
      <v-btn color="primary" prepend-icon="mdi-plus" to="/sales/new">
        Nueva Venta
      </v-btn>
    </div>

    <!-- Summary Cards -->
    <v-row>
      <v-col v-for="card in summaryCards" :key="card.title" cols="12" sm="6" md="4" lg="2.4">
        <v-card class="d-flex align-center">
          <div :class="`bg-${card.color}`" class="pa-4 rounded-s-lg">
            <v-icon :icon="card.icon" size="32" color="white" />
          </div>
          <div class="pa-4">
            <p class="text-h6 font-weight-bold">{{ card.value }}</p>
            <p class="text-medium-emphasis">{{ card.title }}</p>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <v-row class="mt-4">
      <!-- Sales Chart -->
      <v-col cols="12" md="8">
        <v-card>
          <v-card-title>Ventas de los Últimos 7 Días</v-card-title>
          <v-card-text>
            <!-- Chart placeholder -->
            <div style="height: 300px;" class="d-flex align-end justify-center text-medium-emphasis bg-grey-lighten-4 rounded pa-4">
              <!-- This is a simplified static representation of the bar chart -->
              <div class="d-flex align-end" style="width: 100%; height: 100%;">
                <div v-for="(sale, index) in salesChartData.values" :key="index" class="d-flex flex-column align-center flex-grow-1">
                   <div class="bg-primary rounded-t" :style="{ height: (sale / Math.max(...salesChartData.values) * 100) + '%' }"></div>
                   <p class="text-caption text-medium-emphasis mt-2">{{ salesChartData.labels[index] }}</p>
                </div>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Stock Alerts & Quick Summary -->
      <v-col cols="12" md="4">
        <v-card class="mb-4">
          <v-card-item>
            <v-card-title>
              <v-badge
                color="error"
                :content="dashboardData.lowStockProducts?.length || 0"
                inline
              >
                <v-icon icon="mdi-bell-ring-outline" class="mr-2"></v-icon>
                Alertas de Stock
              </v-badge>
            </v-card-title>
          </v-card-item>

          <v-list-item
            v-for="item in dashboardData.lowStockProducts"
            :key="item.id"
            class="bg-red-lighten-5 rounded mx-4 mb-2"
          >
            <v-list-item-title class="font-weight-bold">{{ item.name }}</v-list-item-title>
            <v-list-item-subtitle>{{ `Código: ${item.internalCode || 'N/A'}` }}</v-list-item-subtitle>
            <template v-slot:append>
              <div class="text-right">
                <p class="font-weight-bold text-error">{{ item.currentStock }} / {{ item.minStock }}</p>
                <p class="text-caption">Stock</p>
              </div>
            </template>
          </v-list-item>
          <v-card-text v-if="!dashboardData.lowStockProducts?.length" class="text-center text-medium-emphasis">
            No hay alertas de stock
          </v-card-text>
        </v-card>

        <v-card>
          <v-card-item>
            <v-card-title>
              <v-icon icon="mdi-chart-line" class="mr-2"></v-icon>
              Resumen Rápido
            </v-card-title>
          </v-card-item>
          <v-list-item>
            <div class="d-flex justify-space-between">
              <p>Productos Activos</p>
              <p class="font-weight-bold">{{ dashboardData.quickSummary?.activeProducts || 0 }}</p>
            </div>
            <v-divider class="my-2"></v-divider>
             <div class="d-flex justify-space-between">
              <p>Clientes Activos</p>
              <p class="font-weight-bold">{{ dashboardData.quickSummary?.activeCustomers || 0 }}</p>
            </div>
            <v-divider class="my-2"></v-divider>
             <div class="d-flex justify-space-between">
              <p>Alertas de Stock</p>
               <v-badge color="error" :content="dashboardData.quickSummary?.lowStockCount || 0" inline></v-badge>
            </div>
            <v-divider class="my-2"></v-divider>
             <div class="d-flex justify-space-between">
              <p>Facturas Pendientes</p>
               <p class="font-weight-bold">{{ dashboardData.quickSummary?.pendingInvoices || 0 }}</p>
            </div>
          </v-list-item>
        </v-card>
      </v-col>
    </v-row>

    <!-- Recent Sales -->
    <v-row class="mt-4">
      <v-col cols="12">
        <v-card>
          <v-card-title>Ventas Recientes</v-card-title>
          <v-data-table
            :headers="recentSalesHeaders"
            :items="dashboardData.recentSales || []"
            :loading="loading"
            density="compact"
          >
            <template v-slot:item.total="{ item }">
              {{ formatCurrency(item.total) }}
            </template>
            <template v-slot:item.saleDate="{ item }">
              {{ formatDate(item.saleDate) }}
            </template>
             <template v-slot:item.status="{ item }">
              <v-chip :color="getStatusColor(item.status)" size="small" variant="flat" label>
                {{ getStatusText(item.status) }}
              </v-chip>
            </template>
            <template v-slot:item.paymentMethod="{ item }">
              <v-chip :color="getPaymentMethodColor(item.paymentMethod)" size="small" variant="tonal" label>
                 {{ item.paymentMethod }}
              </v-chip>
            </template>
          </v-data-table>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script>
import dashboardLogic from './Dashboard.js'

export default dashboardLogic
</script>
<style scoped src="./Dashboard.scss"></style>
