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
import { ref, onMounted } from 'vue'

export default {
    name: 'CustomerList',
    setup() {
        const customers = ref([])
        const loading = ref(false)
        const search = ref('')
        const dialog = ref(false)
        const editingCustomer = ref(null)

        const customerForm = ref({
            firstName: '',
            lastName: '',
            email: '',
            phone: '',
            address: '',
            city: '',
            country: ''
        })

        const headers = [
            { text: 'Nombre', value: 'firstName' },
            { text: 'Apellido', value: 'lastName' },
            { text: 'Email', value: 'email' },
            { text: 'Teléfono', value: 'phone' },
            { text: 'Ciudad', value: 'city' },
            { text: 'Acciones', value: 'actions', sortable: false }
        ]

        const loadCustomers = async () => {
            loading.value = true
            try {
                const response = await window.electronAPI.invoke('get-customers')
                customers.value = response
            } catch (error) {
                console.error('Error loading customers:', error)
            } finally {
                loading.value = false
            }
        }

        const openDialog = () => {
            editingCustomer.value = null
            customerForm.value = {
                firstName: '',
                lastName: '',
                email: '',
                phone: '',
                address: '',
                city: '',
                country: ''
            }
            dialog.value = true
        }

        const editCustomer = (customer) => {
            editingCustomer.value = customer
            customerForm.value = { ...customer }
            dialog.value = true
        }

        const closeDialog = () => {
            dialog.value = false
            editingCustomer.value = null
        }

        const saveCustomer = async () => {
            try {
                if (editingCustomer.value) {
                    await window.electronAPI.invoke('update-customer', {
                        id: editingCustomer.value.id,
                        ...customerForm.value
                    })
                } else {
                    await window.electronAPI.invoke('create-customer', customerForm.value)
                }
                await loadCustomers()
                closeDialog()
            } catch (error) {
                console.error('Error saving customer:', error)
            }
        }

        const deleteCustomer = async (customer) => {
            if (confirm('¿Está seguro de que desea eliminar este cliente?')) {
                try {
                    await window.electronAPI.invoke('delete-customer', customer.id)
                    await loadCustomers()
                } catch (error) {
                    console.error('Error deleting customer:', error)
                }
            }
        }

        onMounted(() => {
            loadCustomers()
        })

        return {
            customers,
            loading,
            search,
            dialog,
            editingCustomer,
            customerForm,
            headers,
            openDialog,
            editCustomer,
            closeDialog,
            saveCustomer,
            deleteCustomer
        }
    }
}
</script>
