<template>
  <div>
    <!-- Header -->
    <div class="d-flex justify-space-between align-center mb-4">
      <div>
        <h1 class="text-h5 font-weight-bold">Control de Inventario</h1>
        <p class="text-medium-emphasis">Gestiona el stock y movimientos de inventario</p>
      </div>
      <v-btn color="primary" @click="openAdjustmentDialog()">
        Ajuste de Stock
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

    <!-- Tabs for Inventory and Movements -->
    <v-card class="mt-4">
      <v-tabs v-model="tab" bg-color="transparent">
        <v-tab value="inventory">Inventario Actual</v-tab>
        <v-tab value="movements">Movimientos</v-tab>
      </v-tabs>
      <v-divider></v-divider>

      <v-window v-model="tab">
        <!-- Current Inventory Tab -->
        <v-window-item value="inventory">
          <v-card-text>
            <v-text-field
              v-model="search"
              label="Buscar productos por nombre o código..."
              prepend-inner-icon="mdi-magnify"
              variant="solo-filled"
              density="compact"
              flat
              clearable
            />
          </v-card-text>
           <v-card-item>
            <v-card-title>
              Inventario Actual ({{ filteredProducts.length }} productos)
            </v-card-title>
          </v-card-item>
          <v-data-table
            :headers="inventoryHeaders"
            :items="filteredProducts"
            :loading="loading"
            item-value="id"
            hover
          >
            <template v-slot:item.name="{ item }">
              <div>
                <div class="font-weight-bold">{{ item.name }}</div>
                <div class="text-caption text-medium-emphasis">{{ item.brand || '' }}</div>
              </div>
            </template>
            <template v-slot:item.currentStock="{ item }">
              <span class="font-weight-bold">{{ item.currentStock }}</span> <span class="text-medium-emphasis">unidad</span>
            </template>
            <template v-slot:item.stockLimits="{ item }">
              <div class="text-caption">Mín: {{ item.minStock }} / Máx: {{ item.maxStock }}</div>
            </template>
             <template v-slot:item.stockValue="{ item }">
              <div class="font-weight-bold">{{ formatCurrency(item.costPrice * item.currentStock) }}</div>
            </template>
            <template v-slot:item.status="{ item }">
              <v-chip :color="getStockStatusColor(item)" size="small" variant="tonal">
                {{ getStockStatusText(item) }}
              </v-chip>
            </template>
            <template v-slot:item.actions="{ item }">
              <v-btn icon="mdi-pencil" size="x-small" variant="text" @click="openAdjustmentDialog(item)"></v-btn>
            </template>
          </v-data-table>
        </v-window-item>

        <!-- Movements Tab -->
        <v-window-item value="movements">
          <v-card-text>
             <!-- Placeholder for movements content -->
            <p class="text-center py-8 text-medium-emphasis">Historial de movimientos de inventario.</p>
          </v-card-text>
        </v-window-item>
      </v-window>
    </v-card>
  </div>
</template>

<script>
import inventoryListLogic from './InventoryList.js'

export default inventoryListLogic
</script>