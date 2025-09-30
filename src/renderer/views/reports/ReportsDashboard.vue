<template>
    <v-container fluid>
        <v-row>
            <v-col cols="12">
                <v-card>
                    <v-card-title>
                        <span class="text-h5">Dashboard de Reportes</span>
                    </v-card-title>

                    <v-card-text>
                        <v-row>
                            <!-- Filtros de fecha -->
                            <v-col cols="12" md="3">
                                <v-menu v-model="startDateMenu" :close-on-content-click="false" :nudge-right="40"
                                    transition="scale-transition" offset-y min-width="auto">
                                    <template v-slot:activator="{ on, attrs }">
                                        <v-text-field v-model="startDate" label="Fecha Inicio"
                                            prepend-icon="mdi-calendar" readonly v-bind="attrs"
                                            v-on="on"></v-text-field>
                                    </template>
                                    <v-date-picker v-model="startDate" @input="startDateMenu = false"></v-date-picker>
                                </v-menu>
                            </v-col>

                            <v-col cols="12" md="3">
                                <v-menu v-model="endDateMenu" :close-on-content-click="false" :nudge-right="40"
                                    transition="scale-transition" offset-y min-width="auto">
                                    <template v-slot:activator="{ on, attrs }">
                                        <v-text-field v-model="endDate" label="Fecha Fin" prepend-icon="mdi-calendar"
                                            readonly v-bind="attrs" v-on="on"></v-text-field>
                                    </template>
                                    <v-date-picker v-model="endDate" @input="endDateMenu = false"></v-date-picker>
                                </v-menu>
                            </v-col>

                            <v-col cols="12" md="3">
                                <v-btn color="primary" @click="loadReports">
                                    <v-icon left>mdi-refresh</v-icon>
                                    Actualizar
                                </v-btn>
                            </v-col>
                        </v-row>

                        <!-- Tarjetas de resumen -->
                        <v-row class="mt-4">
                            <v-col cols="12" sm="6" md="3">
                                <v-card color="primary" dark>
                                    <v-card-text>
                                        <div class="text-h4">${{ totalSales.toLocaleString() }}</div>
                                        <div>Ventas Totales</div>
                                    </v-card-text>
                                </v-card>
                            </v-col>

                            <v-col cols="12" sm="6" md="3">
                                <v-card color="success" dark>
                                    <v-card-text>
                                        <div class="text-h4">{{ totalInvoices }}</div>
                                        <div>Facturas Emitidas</div>
                                    </v-card-text>
                                </v-card>
                            </v-col>

                            <v-col cols="12" sm="6" md="3">
                                <v-card color="info" dark>
                                    <v-card-text>
                                        <div class="text-h4">{{ totalCustomers }}</div>
                                        <div>Clientes Activos</div>
                                    </v-card-text>
                                </v-card>
                            </v-col>

                            <v-col cols="12" sm="6" md="3">
                                <v-card color="warning" dark>
                                    <v-card-text>
                                        <div class="text-h4">{{ lowStockProducts }}</div>
                                        <div>Productos Bajo Stock</div>
                                    </v-card-text>
                                </v-card>
                            </v-col>
                        </v-row>

                        <!-- Gráficos y tablas -->
                        <v-row class="mt-4">
                            <v-col cols="12" md="6">
                                <v-card>
                                    <v-card-title>Ventas por Mes</v-card-title>
                                    <v-card-text>
                                        <!-- Aquí iría un gráfico de ventas -->
                                        <div class="text-center pa-4">
                                            <v-icon size="64" color="grey">mdi-chart-line</v-icon>
                                            <div class="mt-2">Gráfico de ventas mensuales</div>
                                        </div>
                                    </v-card-text>
                                </v-card>
                            </v-col>

                            <v-col cols="12" md="6">
                                <v-card>
                                    <v-card-title>Productos Más Vendidos</v-card-title>
                                    <v-card-text>
                                        <v-data-table :headers="topProductsHeaders" :items="topProducts"
                                            :items-per-page="5" hide-default-footer>
                                        </v-data-table>
                                    </v-card-text>
                                </v-card>
                            </v-col>
                        </v-row>

                        <!-- Reportes adicionales -->
                        <v-row class="mt-4">
                            <v-col cols="12">
                                <v-card>
                                    <v-card-title>Acciones de Reportes</v-card-title>
                                    <v-card-text>
                                        <v-row>
                                            <v-col cols="12" md="4">
                                                <v-btn block color="primary" @click="exportSalesReport">
                                                    <v-icon left>mdi-file-excel</v-icon>
                                                    Exportar Reporte de Ventas
                                                </v-btn>
                                            </v-col>
                                            <v-col cols="12" md="4">
                                                <v-btn block color="secondary" @click="exportInventoryReport">
                                                    <v-icon left>mdi-file-pdf-box</v-icon>
                                                    Reporte de Inventario
                                                </v-btn>
                                            </v-col>
                                            <v-col cols="12" md="4">
                                                <v-btn block color="accent" @click="exportCustomerReport">
                                                    <v-icon left>mdi-account-group</v-icon>
                                                    Reporte de Clientes
                                                </v-btn>
                                            </v-col>
                                        </v-row>
                                    </v-card-text>
                                </v-card>
                            </v-col>
                        </v-row>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>
    </v-container>
</template>

<script>
import { ref, onMounted, computed } from 'vue'
import { useReportsStore } from '@/stores/reports'
import { storeToRefs } from 'pinia'

export default {
    name: 'ReportsDashboard',
    setup() {
        const reportsStore = useReportsStore()
        const { dashboardData, productReports } = storeToRefs(reportsStore)

        const startDate = ref(new Date().toISOString().substr(0, 10))
        const endDate = ref(new Date().toISOString().substr(0, 10))
        const startDateMenu = ref(false)
        const endDateMenu = ref(false)

        const totalSales = computed(() => dashboardData.value.summary?.totalSales || 0)
        const totalInvoices = computed(() => dashboardData.value.summary?.pendingInvoices || 0) // Asumiendo que es lo que se quiere mostrar
        const totalCustomers = computed(() => dashboardData.value.summary?.totalCustomers || 0)
        const lowStockProducts = computed(() => dashboardData.value.quickSummary?.lowStockCount || 0)
        const topProducts = computed(() => {
            return (productReports.value || []).map(p => ({
                name: p.productName,
                quantity: p.totalSold,
                total: p.totalRevenue
            }))
        })


        const topProductsHeaders = [
            { title: 'Producto', key: 'name' },
            { title: 'Cantidad Vendida', key: 'quantity' },
            { title: 'Total', key: 'total' }
        ]

        const loadReports = async () => {
            try {
                await reportsStore.fetchDashboardData()
                await reportsStore.fetchProductReport({
                    startDate: startDate.value,
                    endDate: endDate.value,
                    limit: 5
                })
            } catch (error) {
                console.error('Error loading reports:', error)
            }
        }

        const exportSalesReport = async () => {
            // Lógica de exportación a implementar con el store
            console.log('Exporting sales report...')
        }

        const exportInventoryReport = async () => {
            // Lógica de exportación a implementar con el store
            console.log('Exporting inventory report...')
        }

        const exportCustomerReport = async () => {
            // Lógica de exportación a implementar con el store
            console.log('Exporting customer report...')
        }

        onMounted(() => {
            const thirtyDaysAgo = new Date()
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
            startDate.value = thirtyDaysAgo.toISOString().substr(0, 10)

            loadReports()
        })

        return {
            startDate,
            endDate,
            startDateMenu,
            endDateMenu,
            totalSales,
            totalInvoices,
            totalCustomers,
            lowStockProducts,
            topProducts,
            topProductsHeaders,
            loadReports,
            exportSalesReport,
            exportInventoryReport,
            exportCustomerReport
        }
    }
}
</script>
