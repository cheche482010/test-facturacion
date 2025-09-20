<template>
  <div class="text-black dark:text-white">
    <!-- Header -->
    <div class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-3xl font-bold">Dashboard</h1>
        <p class="text-gray-500 dark:text-gray-400">{{ formattedDate }}</p>
      </div>
      <router-link
        to="/sales/new"
        class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
      >
        <svg class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
        <span>Nueva Venta</span>
      </router-link>
    </div>

    <!-- Summary Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
      <div v-for="card in summaryCards" :key="card.title" class="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md flex items-center">
        <div :class="[card.color, 'rounded-full p-3 mr-4']">
          <component :is="card.icon" class="h-6 w-6 text-white" />
        </div>
        <div>
          <p class="text-sm text-gray-500 dark:text-gray-400">{{ card.title }}</p>
          <p class="text-2xl font-bold">{{ card.value }}</p>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
      <!-- Sales Chart -->
      <div class="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
        <h2 class="text-xl font-semibold mb-4">Ventas de los Últimos 7 Días</h2>
        <Line v-if="!loading" :data="chartData" :options="chartOptions" style="height: 300px" />
      </div>

      <!-- Side info -->
      <div class="space-y-6">
        <!-- Stock Alerts -->
        <div class="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-semibold">Alertas de Stock</h2>
            <div class="bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">{{ dashboardData.lowStockProducts?.length || 0 }}</div>
          </div>
          <div class="space-y-3">
            <div v-if="!dashboardData.lowStockProducts?.length" class="text-center text-gray-500 dark:text-gray-400 py-4">
              No hay alertas de stock
            </div>
            <div v-for="item in dashboardData.lowStockProducts" :key="item.id" class="bg-red-100 dark:bg-red-900/30 p-3 rounded-lg flex justify-between items-center">
              <div>
                <p class="font-semibold">{{ item.name }}</p>
                <p class="text-sm text-gray-600 dark:text-gray-400">Código: {{ item.internalCode || 'N/A' }}</p>
              </div>
              <div class="text-right">
                <p class="font-bold text-red-600 dark:text-red-400">{{ item.currentStock }} / {{ item.minStock }}</p>
                <p class="text-xs text-gray-500">Stock</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Quick Summary -->
        <div class="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
          <h2 class="text-xl font-semibold mb-4">Resumen Rápido</h2>
          <div class="space-y-4">
            <div class="flex justify-between items-center">
              <p>Productos Activos</p>
              <span class="font-bold text-lg">{{ dashboardData.quickSummary?.activeProducts || 0 }}</span>
            </div>
            <div class="flex justify-between items-center">
              <p>Clientes Activos</p>
              <span class="font-bold text-lg">{{ dashboardData.quickSummary?.activeCustomers || 0 }}</span>
            </div>
            <div class="flex justify-between items-center">
              <p>Alertas de Stock</p>
               <span class="font-bold text-lg text-red-500">{{ dashboardData.quickSummary?.lowStockCount || 0 }}</span>
            </div>
            <div class="flex justify-between items-center">
              <p>Facturas Pendientes</p>
              <span class="font-bold text-lg text-yellow-500">{{ dashboardData.quickSummary?.pendingInvoices || 0 }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Recent Sales -->
    <div class="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md mt-6">
      <h2 class="text-xl font-semibold mb-4">Ventas Recientes</h2>
      <table class="w-full text-left">
        <thead>
          <tr class="border-b dark:border-slate-700">
            <th class="py-3 px-4 font-semibold">Factura</th>
            <th class="py-3 px-4 font-semibold">Cliente</th>
            <th class="py-3 px-4 font-semibold">Fecha</th>
            <th class="py-3 px-4 font-semibold">Pago</th>
            <th class="py-3 px-4 font-semibold">Estado</th>
            <th class="py-3 px-4 font-semibold text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!dashboardData.recentSales?.length">
            <td colspan="6" class="text-center py-8 text-gray-500">No hay ventas recientes.</td>
          </tr>
          <tr v-for="sale in dashboardData.recentSales" :key="sale.id" class="border-b dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50">
            <td class="py-3 px-4">{{ sale.invoiceNumber }}</td>
            <td class="py-3 px-4">{{ sale.Customer.name }}</td>
            <td class="py-3 px-4">{{ formatDate(sale.saleDate) }}</td>
            <td class="py-3 px-4">
                <span class="px-2 py-1 text-xs rounded-full" :class="getPaymentMethodClass(sale.paymentMethod)">
                    {{ sale.paymentMethod }}
                </span>
            </td>
            <td class="py-3 px-4">
              <span class="px-2 py-1 text-xs font-semibold rounded-full" :class="getStatusClass(sale.status)">
                {{ getStatusText(sale.status) }}
              </span>
            </td>
            <td class="py-3 px-4 text-right font-semibold">{{ formatCurrency(sale.total) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, markRaw } from 'vue'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
} from 'chart.js'
import { useReportsStore } from '../../stores/reports'
import { formatCurrency, formatDate } from '../utils/formatters'

ChartJS.register(Title, Tooltip, Legend, LineElement, CategoryScale, LinearScale, PointElement)

// Icons
const ProductsIcon = { template: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>` };
const CustomersIcon = { template: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>` };
const TotalSalesIcon = { template: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" x2="12" y1="1" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>` };
const TodaySalesIcon = { template: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z"/><path d="M7 7h.01"/></svg>` };
const InventoryValueIcon = { template: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>` };


const reportsStore = useReportsStore()
const loading = ref(true)
const dashboardData = ref({})

const formattedDate = computed(() => {
  const date = new Date();
  return `${date.toLocaleDateString('es-ES', { weekday: 'long' })}, ${date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}`;
});

const summaryCards = computed(() => [
  { title: 'Total Productos', value: dashboardData.value.summary?.totalProducts || 0, icon: markRaw(ProductsIcon), color: 'bg-blue-500' },
  { title: 'Total Clientes', value: dashboardData.value.summary?.totalCustomers || 0, icon: markRaw(CustomersIcon), color: 'bg-green-500' },
  { title: 'Ventas Totales', value: formatCurrency(dashboardData.value.summary?.totalSales), icon: markRaw(TotalSalesIcon), color: 'bg-purple-500' },
  { title: 'Ventas Hoy', value: formatCurrency(dashboardData.value.summary?.todaySales), icon: markRaw(TodaySalesIcon), color: 'bg-orange-500' },
  { title: 'Valor Inventario', value: formatCurrency(dashboardData.value.summary?.inventoryValue), icon: markRaw(InventoryValueIcon), color: 'bg-indigo-500' },
]);

const chartData = computed(() => ({
  labels: dashboardData.value.salesLast7Days?.map(d => new Date(d.date).toLocaleDateString('es-ES', { weekday: 'short' })) || [],
  datasets: [
    {
      label: 'Ventas',
      backgroundColor: 'rgba(59, 130, 246, 0.2)',
      borderColor: 'rgba(59, 130, 246, 1)',
      data: dashboardData.value.salesLast7Days?.map(d => d.total) || [],
      fill: true,
      tension: 0.4,
    },
  ],
}));

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
    },
  },
  scales: {
    x: {
      grid: {
        display: false,
      },
    },
    y: {
      beginAtZero: true,
    },
  },
};

const getStatusClass = (status) => {
  const classes = {
    paid: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  };
  return classes[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
};

const getStatusText = (status) => {
  const texts = { paid: 'Pagado', pending: 'Pendiente', cancelled: 'Cancelado' };
  return texts[status] || status;
};

const getPaymentMethodClass = (method) => {
    // Simple styling for payment method
    return 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200';
}

onMounted(async () => {
  try {
    loading.value = true
    const data = await reportsStore.fetchDashboardData()
    dashboardData.value = data
  } catch (error) {
    console.error('Error loading dashboard:', error)
  } finally {
    loading.value = false
  }
})
</script>
