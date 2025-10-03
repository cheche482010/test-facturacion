<template>
    <v-container fluid>
        <v-row>
            <v-col cols="12">
                <v-card>
                    <v-card-title class="d-flex justify-space-between align-center">
                        <span class="text-h5">Gestión de Clientes</span>
                        <v-btn color="primary" @click="openDialog">
                            <v-icon left>mdi-plus</v-icon>
                            Nuevo Cliente
                        </v-btn>
                    </v-card-title>

                    <v-card-text>
                        <v-text-field v-model="search" append-icon="mdi-magnify" label="Buscar clientes..." single-line
                            hide-details class="mb-4"></v-text-field>

                        <v-data-table :headers="headers" :items="customers" :search="search" :loading="loading"
                            class="elevation-1">
                            <template v-slot:item.actions="{ item }">
                                <v-icon small class="mr-2" @click="editCustomer(item)">
                                    mdi-pencil
                                </v-icon>
                                <v-icon small @click="deleteCustomer(item)">
                                    mdi-delete
                                </v-icon>
                            </template>
                        </v-data-table>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>

        <!-- Dialog para crear/editar cliente -->
        <v-dialog v-model="dialog" max-width="600px">
            <v-card>
                <v-card-title>
                    <span class="text-h5">{{ editingCustomer ? 'Editar Cliente' : 'Nuevo Cliente' }}</span>
                </v-card-title>

                <v-card-text>
                    <v-container>
                        <v-row>
                            <v-col cols="12" sm="6">
                                <v-text-field v-model="customerForm.firstName" label="Nombre*" required></v-text-field>
                            </v-col>
                            <v-col cols="12" sm="6">
                                <v-text-field v-model="customerForm.lastName" label="Apellido*" required></v-text-field>
                            </v-col>
                            <v-col cols="12" sm="6">
                                <v-text-field v-model="customerForm.email" label="Email" type="email"></v-text-field>
                            </v-col>
                            <v-col cols="12" sm="6">
                                <v-text-field v-model="customerForm.phone" label="Teléfono"></v-text-field>
                            </v-col>
                            <v-col cols="12">
                                <v-text-field v-model="customerForm.address" label="Dirección"></v-text-field>
                            </v-col>
                            <v-col cols="12" sm="6">
                                <v-text-field v-model="customerForm.city" label="Ciudad"></v-text-field>
                            </v-col>
                            <v-col cols="12" sm="6">
                                <v-text-field v-model="customerForm.country" label="País"></v-text-field>
                            </v-col>
                        </v-row>
                    </v-container>
                </v-card-text>

                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn color="blue darken-1" text @click="closeDialog">
                        Cancelar
                    </v-btn>
                    <v-btn color="blue darken-1" text @click="saveCustomer">
                        Guardar
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </v-container>
</template>

<script>
import customerListLogic from './CustomerList.js'

export default customerListLogic
</script>
