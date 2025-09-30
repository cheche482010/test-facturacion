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
import reportsDashboardLogic from './ReportsDashboard.js'

export default reportsDashboardLogic
</script>
