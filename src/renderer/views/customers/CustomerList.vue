<template>
    <v-container fluid>
        <!-- Title and New Customer Button -->
        <v-row class="align-center mb-4">
            <v-col cols="12" md="6">
                <h1 class="text-h4 font-weight-bold">Gestión de Clientes</h1>
                <p class="text-subtitle-1 text-grey-darken-1">Administra tu base de datos de clientes y su información
                </p>
            </v-col>
            <v-col cols="12" md="6" class="text-md-right">
                <v-btn color="primary" large @click="openDialog()" class="elevation-2">
                    <v-icon left>mdi-plus</v-icon>
                    Nuevo Cliente
                </v-btn>
            </v-col>
        </v-row>

        <!-- Summary Cards -->
        <v-row>
            <v-col cols="12" sm="6" md="3">
                <v-card class="pa-2" elevation="2">
                    <div class="d-flex align-center">
                        <v-avatar color="blue-lighten-4" size="48">
                            <v-icon color="blue-darken-2">mdi-account-group-outline</v-icon>
                        </v-avatar>
                        <div class="ml-4">
                            <p class="text-subtitle-2 text-grey-darken-1 mb-0">Total Clientes</p>
                            <p class="text-h5 font-weight-bold mb-0">{{ totalClients }}</p>
                        </div>
                    </div>
                </v-card>
            </v-col>
            <v-col cols="12" sm="6" md="3">
                <v-card class="pa-2" elevation="2">
                    <div class="d-flex align-center">
                        <v-avatar color="green-lighten-4" size="48">
                            <v-icon color="green-darken-2">mdi-account-check-outline</v-icon>
                        </v-avatar>
                        <div class="ml-4">
                            <p class="text-subtitle-2 text-grey-darken-1 mb-0">Clientes Activos</p>
                            <p class="text-h5 font-weight-bold mb-0">{{ activeClients }}</p>
                        </div>
                    </div>
                </v-card>
            </v-col>
            <v-col cols="12" sm="6" md="3">
                <v-card class="pa-2" elevation="2">
                    <div class="d-flex align-center">
                        <v-avatar color="purple-lighten-4" size="48">
                            <v-icon color="purple-darken-2">mdi-account-star-outline</v-icon>
                        </v-avatar>
                        <div class="ml-4">
                            <p class="text-subtitle-2 text-grey-darken-1 mb-0">Clientes Premium</p>
                            <p class="text-h5 font-weight-bold mb-0">{{ premiumClients }}</p>
                        </div>
                    </div>
                </v-card>
            </v-col>
            <v-col cols="12" sm="6" md="3">
                <v-card class="pa-2" elevation="2">
                    <div class="d-flex align-center">
                        <v-avatar color="orange-lighten-4" size="48">
                            <v-icon color="orange-darken-2">mdi-cash-multiple</v-icon>
                        </v-avatar>
                        <div class="ml-4">
                            <p class="text-subtitle-2 text-grey-darken-1 mb-0">Saldo Pendiente</p>
                            <p class="text-h5 font-weight-bold mb-0">$0.00</p>
                        </div>
                    </div>
                </v-card>
            </v-col>
        </v-row>

        <!-- Filters and Search -->
        <v-card class="mt-6" elevation="2">
            <v-card-text>
                <v-row class="align-center">
                    <v-col cols="12" md="4">
                        <v-text-field v-model="search" prepend-inner-icon="mdi-magnify"
                            label="Buscar por nombre, documento o email..." variant="outlined" dense
                            hide-details></v-text-field>
                    </v-col>
                    <v-col cols="12" md="2">
                        <v-select v-model="categoryFilter" :items="['Todos', 'normal', 'mayorista', 'preferencial']"
                            label="Categoría" variant="outlined" dense hide-details class="text-capitalize"></v-select>
                    </v-col>
                    <v-col cols="12" md="2">
                        <v-select v-model="statusFilter" :items="['Todos', 'Activo', 'Inactivo']" label="Estado"
                            variant="outlined" dense hide-details></v-select>
                    </v-col>
                    <v-col cols="12" md="2">
                        <v-select v-model="typeFilter" :items="['Todos']" label="Tipo" variant="outlined" dense
                            hide-details></v-select>
                    </v-col>
                </v-row>
            </v-card-text>
        </v-card>

        <!-- Customer List -->
        <v-card class="mt-6" elevation="2">
            <v-card-title class="d-flex justify-space-between align-center">
                <span class="text-h6 font-weight-medium">Lista de Clientes ({{ totalClients }})</span>
            </v-card-title>
            <v-data-table :headers="headers" :items="customers" :search="search" :loading="loading"
                class="no-horizontal-lines">
                <!-- Custom Slots for columns -->
                <template v-slot:item.client="{ item }">
                    <div class="d-flex align-center py-2">
                        <v-avatar color="blue-lighten-4" size="40">
                            <v-icon color="blue-darken-2">{{ item.customer_type === 'juridico' ? 'mdi-domain' :
                                'mdi-account' }}</v-icon>
                        </v-avatar>
                        <div class="ml-3">
                            <p class="font-weight-bold mb-0">{{ item.customer_type === 'juridico' ?
                                item.company_name : `${item.first_name || ''} ${item.last_name ||
                                    ''}`.trim() }}</p>
                            <p class="text-caption text-grey-darken-1 mb-0"
                                v-if="item.customer_type === 'juridico' && item.first_name">{{
                                    `${item.first_name || ''} ${item.last_name || ''}`.trim() }}</p>
                        </div>
                    </div>
                </template>

                <template v-slot:item.document="{ item }">
                    <div>
                        <p class="font-weight-medium mb-0">{{ item.document_number }}</p>
                        <p class="text-caption text-grey-darken-1 mb-0">{{ item.document_type }}</p>
                    </div>
                </template>

                <template v-slot:item.contact="{ item }">
                    <div>
                        <p class="font-weight-medium mb-0">{{ item.phone }}</p>
                        <p class="text-caption text-grey-darken-1 mb-0">{{ item.email }}</p>
                    </div>
                </template>

                <template v-slot:item.category="{ item }">
                    <v-chip :color="getCategoryColor(item.category)" variant="tonal" size="small"
                        class="text-capitalize">
                        {{ item.category }}
                    </v-chip>
                </template>

                <template v-slot:item.credit_limit="{ item }">
                    <span>${{ parseFloat(item.credit_limit || 0).toFixed(2) }}</span>
                </template>

                <template v-slot:item.is_active="{ item }">
                    <v-chip :color="item.is_active ? 'green' : 'red'" variant="tonal" size="small">
                        {{ item.is_active ? 'Activo' : 'Inactivo' }}
                    </v-chip>
                </template>

                <template v-slot:item.actions="{ item }">
                    <div>
                        <v-btn icon="mdi-pencil" variant="text" color="grey-darken-1"
                            @click="editCustomer(item)"></v-btn>
                        <v-btn icon="mdi-delete" variant="text" color="grey-darken-1"
                            @click="deleteCustomer(item)"></v-btn>
                    </div>
                </template>

            </v-data-table>
        </v-card>

        <!-- Dialog for New/Edit Customer -->
        <v-dialog v-model="dialog" max-width="700px">
            <v-card>
                <v-card-title>
                    <span class="text-h5">{{ editingCustomer ? 'Editar Cliente' : 'Nuevo Cliente' }}</span>
                </v-card-title>
                <v-card-text>
                    <v-container>
                        <v-row>
                            <v-col cols="12">
                                <v-text-field v-model="customerForm.company_name"
                                    label="Razón Social (si es Persona Jurídica)" variant="outlined"
                                    dense></v-text-field>
                            </v-col>
                            <v-col cols="12" sm="6">
                                <v-text-field v-model="customerForm.first_name" label="Nombre(s)*" required
                                    variant="outlined" dense></v-text-field>
                            </v-col>
                            <v-col cols="12" sm="6">
                                <v-text-field v-model="customerForm.last_name" label="Apellido(s)" variant="outlined"
                                    dense></v-text-field>
                            </v-col>
                            <v-col cols="12" sm="4">
                                <v-select v-model="customerForm.document_type" :items="['CI', 'RIF', 'PASSPORT']"
                                    label="Tipo de Documento*" required variant="outlined" dense></v-select>
                            </v-col>
                            <v-col cols="12" sm="8">
                                <v-text-field v-model="customerForm.document_number" label="Número de Documento*"
                                    required variant="outlined" dense></v-text-field>
                            </v-col>
                            <v-col cols="12" sm="6">
                                <v-text-field v-model="customerForm.phone" label="Teléfono" type="tel"
                                    variant="outlined" dense></v-text-field>
                            </v-col>
                            <v-col cols="12" sm="6">
                                <v-text-field v-model="customerForm.email" label="Email" type="email" variant="outlined"
                                    dense></v-text-field>
                            </v-col>
                            <v-col cols="12">
                                <v-text-field v-model="customerForm.address" label="Dirección" variant="outlined"
                                    dense></v-text-field>
                            </v-col>
                            <v-col cols="12" sm="4">
                                <v-select v-model="customerForm.category"
                                    :items="['normal', 'mayorista', 'preferencial']" label="Categoría"
                                    variant="outlined" dense class="text-capitalize"></v-select>
                            </v-col>
                            <v-col cols="12" sm="4">
                                <v-text-field v-model.number="customerForm.credit_limit" label="Límite de Crédito"
                                    type="number" prefix="$" variant="outlined" dense></v-text-field>
                            </v-col>
                            <v-col cols="12" sm="4">
                                <v-select v-model="customerForm.is_active"
                                    :items="[{ title: 'Activo', value: true }, { title: 'Inactivo', value: false }]"
                                    label="Estado" variant="outlined" dense></v-select>
                            </v-col>
                        </v-row>
                    </v-container>
                    <small>*Razón Social o Nombre(s) es obligatorio.</small>
                </v-card-text>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn color="blue darken-1" text @click="closeDialog">Cancelar</v-btn>
                    <v-btn color="blue darken-1" text @click="saveCustomer">Guardar</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </v-container>
</template>

<script>
import customerListLogic from './CustomerList.js'

export default {
    ...customerListLogic,
    methods: {
        getCategoryColor(category) {
            switch (category) {
                case 'mayorista': return 'orange';
                case 'preferencial': return 'purple';
                case 'normal': return 'blue';
                default: return 'grey';
            }
        }
    }
}
</script>

<style>
.v-data-table.no-horizontal-lines tbody tr:not(:last-child) td {
    border-bottom: none !important;
}

.v-data-table__td {
    vertical-align: middle !important;
}
</style>
