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
      <v-col v-for="card in summaryCards" :key="card.title" cols="12" md>
        <v-card :color="card.color" class="text-white">
          <v-card-text class="d-flex justify-space-between align-center">
            <div>
              <div class="text-h4 font-weight-bold">{{ card.value }}</div>
              <div class="text-body-1">{{ card.title }}</div>
            </div>
            <v-icon size="48">{{ card.icon }}</v-icon>
          </v-card-text>
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
            <div style="height: 300px;" class="d-flex align-center justify-center text-medium-emphasis bg-grey-lighten-4 rounded">
              <v-sparkline
                :value="salesChartData.values"
                :labels="salesChartData.labels"
                :gradient="['#1976D2', '#42A5F5', '#64B5F6']"
                height="100"
                padding="24"
                stroke-linecap="round"
                smooth
              >
                <template v-slot:label="item">
                  {{ item.value }}
                </template>
              </v-sparkline>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Stock Alerts & Quick Summary -->
      <v-col cols="12" md="4">
        <v-card class="mb-4">
          <v-card-title class="d-flex align-center">
            Alertas de Stock
            <v-chip color="error" size="small" class="ml-2">{{ dashboardData.lowStockProducts?.length || 0 }}</v-chip>
          </v-card-title>
          <v-list>
            <v-list-item
              v-for="item in dashboardData.lowStockProducts"
              :key="item.id"
              :title="item.name"
              :subtitle="`Código: ${item.internalCode || 'N/A'}`"
            >
              <template v-slot:append>
                <v-chip color="error" variant="tonal" size="small">
                  {{ item.currentStock }} / {{ item.minStock }}
                </v-chip>
              </template>
            </v-list-item>
             <v-list-item v-if="!dashboardData.lowStockProducts?.length">
              <v-list-item-title class="text-center text-medium-emphasis">No hay alertas de stock</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-card>

        <v-card>
          <v-card-title>Resumen Rápido</v-card-title>
           <v-list density="compact">
            <v-list-item title="Productos Activos">
              <template v-slot:append>
                <v-chip color="success" size="small">{{ dashboardData.quickSummary?.activeProducts || 0 }}</v-chip>
              </template>
            </v-list-item>
            <v-list-item title="Clientes Activos">
               <template v-slot:append>
                <v-chip color="primary" size="small">{{ dashboardData.quickSummary?.activeCustomers || 0 }}</v-chip>
              </template>
            </v-list-item>
            <v-list-item title="Alertas de Stock">
               <template v-slot:append>
                <v-chip color="warning" size="small">{{ dashboardData.quickSummary?.lowStockCount || 0 }}</v-chip>
              </template>
            </v-list-item>
            <v-list-item title="Facturas Pendientes">
               <template v-slot:append>
                <v-chip color="info" size="small">{{ dashboardData.quickSummary?.pendingInvoices || 0 }}</v-chip>
              </template>
            </v-list-item>
          </v-list>
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
              <v-chip :color="getStatusColor(item.status)" size="small" variant="tonal">
                {{ getStatusText(item.status) }}
              </v-chip>
            </template>
             <template v-slot:item.paymentMethod="{ item }">
              <v-chip size="small" variant="outlined">
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
