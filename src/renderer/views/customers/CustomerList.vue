<template>
  <div>
    <!-- Header -->
    <div class="d-flex justify-space-between align-center mb-4">
      <div>
        <h1 class="text-h5 font-weight-bold">Gestión de Clientes</h1>
        <p class="text-medium-emphasis">Administra tu base de datos de clientes y su información</p>
      </div>
      <v-btn color="primary" prepend-icon="mdi-plus" @click="openCustomerDialog()">
        Nuevo Cliente
      </v-btn>
    </div>

    <!-- Summary Cards -->
    <v-row>
      <v-col v-for="card in summaryCards" :key="card.title" cols="12" sm="6" md="3">
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

    <!-- Filters and Table -->
    <v-card class="mt-4">
      <v-card-text>
        <v-row class="d-flex align-center">
          <v-col cols="12" md="5">
            <v-text-field
              v-model="search"
              label="Buscar por nombre, documento o email..."
              prepend-inner-icon="mdi-magnify"
              variant="solo-filled"
              density="compact"
              flat
              clearable
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-select
              label="Categoría"
              variant="solo-filled"
              density="compact"
              flat
              clearable
            />
          </v-col>
          <v-col cols="12" md="2">
            <v-select
              label="Estado"
              variant="solo-filled"
              density="compact"
              flat
              clearable
            />
          </v-col>
           <v-col cols="12" md="2">
            <v-select
              label="Tipo"
              variant="solo-filled"
              density="compact"
              flat
              clearable
            />
          </v-col>
        </v-row>
      </v-card-text>
      <v-card-item>
        <v-card-title>
          Lista de Clientes ({{ filteredCustomers.length }})
        </v-card-title>
      </v-card-item>
      <v-data-table
        :headers="headers"
        :items="filteredCustomers"
        :loading="loading"
        item-value="id"
        hover
      >
        <template v-slot:item.name="{ item }">
          <div class="d-flex align-center">
            <v-avatar color="primary" size="32" class="mr-3">
              <span class="text-white">{{ item.name.charAt(0) }}</span>
            </v-avatar>
            <div>
              <div class="font-weight-bold">{{ item.name }}</div>
              <div class="text-caption text-medium-emphasis">{{ item.idNumber }}</div>
            </div>
          </div>
        </template>
        <template v-slot:item.contact="{ item }">
           <div>
              <div>{{ item.phone }}</div>
              <div class="text-caption text-medium-emphasis">{{ item.email }}</div>
            </div>
        </template>
        <template v-slot:item.category="{ item }">
          <v-chip size="small" variant="tonal" :color="getCategoryColor(item.category)">{{ item.category }}</v-chip>
        </template>
         <template v-slot:item.creditLimit="{ item }">
          <div class="font-weight-bold">{{ formatCurrency(item.creditLimit) }}</div>
        </template>
        <template v-slot:item.status="{ item }">
           <v-chip :color="getStatusColor(item.status)" size="small" variant="flat" label>
            {{ getStatusText(item.status) }}
          </v-chip>
        </template>
        <template v-slot:item.actions="{ item }">
          <v-btn icon="mdi-pencil" size="x-small" variant="text" @click="openCustomerDialog(item)"></v-btn>
          <v-btn icon="mdi-delete" size="x-small" variant="text" color="error" @click="confirmDelete(item)"></v-btn>
        </template>
      </v-data-table>
    </v-card>

    <!-- Dialog for creating/editing customer -->
    <CustomerDialog
      v-model="customerDialog"
      :customer="selectedCustomer"
      @saved="onCustomerSaved"
    />

    <!-- Dialog for delete confirmation -->
     <v-dialog v-model="deleteDialog" max-width="400">
      <v-card>
        <v-card-title>Confirmar Eliminación</v-card-title>
        <v-card-text>
          ¿Está seguro que desea eliminar al cliente "{{ customerToDelete?.name }}"?
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="deleteDialog = false">Cancelar</v-btn>
          <v-btn color="error" @click="deleteCustomer">Eliminar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

  </div>
</template>

<script>
import customerListLogic from './CustomerList.js'
import CustomerDialog from '../../components/customers/CustomerDialog.vue'

export default {
  ...customerListLogic,
  components: {
    CustomerDialog
  }
}
</script>