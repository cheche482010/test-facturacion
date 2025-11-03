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
          <div :class="`bg-${card.color}`" class="pa-4 ma-4 rounded-lg">
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
            <v-row>
              <v-col cols="12" md="6">
                <v-text-field v-model="search" label="Buscar productos por nombre o código..."
                  prepend-inner-icon="mdi-magnify" variant="solo-filled" density="compact" flat clearable />
              </v-col>
              <v-col cols="12" md="3">
                <v-select v-model="statusFilter" :items="statusOptions" label="Estado"
                  variant="solo-filled" density="compact" flat></v-select>
              </v-col>
              <v-col cols="12" md="3">
                <v-select v-model="valueFilter" :items="valueOptions" label="Valor" variant="solo-filled"
                  density="compact" flat></v-select>
              </v-col>
            </v-row>
          </v-card-text>
          <v-card-item>
            <v-card-title>
              Inventario Actual ({{ filteredProducts.length }} productos)
            </v-card-title>
          </v-card-item>
          <v-data-table :headers="inventoryHeaders" :items="filteredProducts" :loading="loading" item-value="id" hover>
            <template v-slot:item.name="{ item }">
              <div>
                <div class="font-weight-bold">{{ item.name }}</div>
                <div class="text-caption text-medium-emphasis">{{ item.brand || '' }}</div>
              </div>
            </template>
            <template v-slot:item.currentStock="{ item }">
              <span class="font-weight-bold">{{ item.currentStock }}</span> <span
                class="text-medium-emphasis">unidad</span>
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
              <v-btn icon="mdi-delete" size="x-small" variant="text" @click="deleteProduct(item)"></v-btn>
              <v-btn icon="mdi-eye" size="x-small" variant="text" @click="viewProductDetails(item)"></v-btn>
            </template>
          </v-data-table>
        </v-window-item>

        <!-- Movements Tab -->
        <v-window-item value="movements">
          <v-card-text>
            <v-row>
              <v-col cols="12" md="3">
                <v-text-field v-model="searchMovement" label="Buscar por producto..."
                  prepend-inner-icon="mdi-magnify" variant="solo-filled" density="compact" flat clearable />
              </v-col>
              <v-col cols="12" md="3">
                <v-select v-model="movementTypeFilter" :items="movementTypeOptions" label="Tipo de Movimiento"
                  variant="solo-filled" density="compact" flat></v-select>
              </v-col>
              <v-col cols="12" md="3">
                <v-text-field v-model="startDate" type="date" label="Fecha Desde" variant="solo-filled" density="compact" flat />
              </v-col>
              <v-col cols="12" md="3">
                <v-text-field v-model="endDate" type="date" label="Fecha Hasta" variant="solo-filled" density="compact" flat />
              </v-col>
            </v-row>
          </v-card-text>
          <v-card-item>
            <v-card-title>
              Movimientos de Inventario ({{ filteredMovements.length }} movimientos)
            </v-card-title>
          </v-card-item>
          <v-data-table :headers="movementHeaders" :items="filteredMovements" :loading="loadingMovements" item-value="id" hover>
            <template v-slot:item.product="{ item }">
              <div>
                <div class="font-weight-bold">{{ item.product?.name }}</div>
                <div class="text-caption text-medium-emphasis">{{ item.product?.internalCode }}</div>
              </div>
            </template>
            <template v-slot:item.movementType="{ item }">
              <v-chip :color="getMovementTypeColor(item.movementType)" size="small" variant="tonal">
                {{ getMovementTypeText(item.movementType) }}
              </v-chip>
            </template>
            <template v-slot:item.quantity="{ item }">
              <span :class="item.movementType === 'entrada' ? 'text-success' : 'text-error'">
                {{ item.movementType === 'entrada' ? '+' : '-' }}{{ item.quantity }}
              </span>
            </template>
            <template v-slot:item.priceInfo="{ item }">
              <div class="text-caption">
                <div>USD: ${{ item.product?.dollarPrice || 0 }}</div>
                <div>Bs: {{ formatCurrency(item.product?.retailPrice || 0) }}</div>
              </div>
            </template>
            <template v-slot:item.movementDate="{ item }">
              {{ formatDate(item.movementDate) }}
            </template>
            <template v-slot:item.actions="{ item }">
              <v-btn icon="mdi-eye" size="x-small" variant="text" @click="viewMovementDetails(item)"></v-btn>
            </template>
          </v-data-table>
        </v-window-item>
      </v-window>
    </v-card>
  </div>

  <!-- Stock Adjustment Dialog -->
  <StockAdjustmentDialog
    v-model="adjustmentDialog"
    :product="selectedProduct"
    @saved="onAdjustmentSaved"
  />

  <!-- Product Details Dialog -->
  <v-dialog v-model="productDetailsDialog" max-width="600px">
    <v-card v-if="selectedProduct">
      <v-card-title>
        <span class="text-h5">Detalles del Producto</span>
      </v-card-title>
      <v-card-text>
        <v-row>
          <v-col cols="12">
            <v-text-field
              :model-value="selectedProduct.name"
              label="Nombre"
              readonly
              variant="outlined"
            />
          </v-col>
          <v-col cols="12" md="6">
            <v-text-field
              :model-value="selectedProduct.internalCode"
              label="Código Interno"
              readonly
              variant="outlined"
            />
          </v-col>
          <v-col cols="12" md="6">
            <v-text-field
              :model-value="selectedProduct.barcode"
              label="Código de Barras"
              readonly
              variant="outlined"
            />
          </v-col>
          <v-col cols="12" md="6">
            <v-text-field
              :model-value="selectedProduct.currentStock"
              label="Stock Actual"
              readonly
              variant="outlined"
            />
          </v-col>
          <v-col cols="12" md="6">
            <v-text-field
              :model-value="formatCurrency(selectedProduct.retailPrice)"
              label="Precio de Venta"
              readonly
              variant="outlined"
            />
          </v-col>
          <v-col cols="12" md="6">
            <v-text-field
              :model-value="formatCurrency(selectedProduct.costPrice)"
              label="Precio de Compra"
              readonly
              variant="outlined"
            />
          </v-col>
          <v-col cols="12" md="6">
            <v-text-field
              :model-value="selectedProduct.profitPercentage + '%'"
              label="Ganancia"
              readonly
              variant="outlined"
            />
          </v-col>
          <v-col cols="12">
            <v-text-field
              :model-value="selectedProduct.description"
              label="Descripción"
              readonly
              variant="outlined"
            />
          </v-col>
          <v-col cols="12" md="6">
            <v-text-field
              :model-value="selectedProduct.brand"
              label="Marca"
              readonly
              variant="outlined"
            />
          </v-col>
          <v-col cols="12" md="6">
            <v-text-field
              :model-value="selectedProduct.unit"
              label="Unidad"
              readonly
              variant="outlined"
            />
          </v-col>
          <v-col cols="12" md="6">
            <v-text-field
              :model-value="selectedProduct.status"
              label="Estado"
              readonly
              variant="outlined"
            />
          </v-col>
          <v-col cols="12" md="6">
            <v-text-field
              :model-value="selectedProduct.category?.name"
              label="Categoría"
              readonly
              variant="outlined"
            />
          </v-col>
        </v-row>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn @click="closeProductDetailsDialog">Cerrar</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- Movement Details Dialog -->
  <v-dialog v-model="movementDetailsDialog" max-width="600px">
    <v-card v-if="selectedMovement">
      <v-card-title>
        <span class="text-h5">Detalles del Movimiento</span>
      </v-card-title>
      <v-card-text>
        <v-row>
          <v-col cols="12">
            <v-text-field
              :model-value="selectedMovement.product?.name"
              label="Producto"
              readonly
              variant="outlined"
            />
          </v-col>
          <v-col cols="12" md="6">
            <v-text-field
              :model-value="selectedMovement.product?.internalCode"
              label="Código Interno"
              readonly
              variant="outlined"
            />
          </v-col>
          <v-col cols="12" md="6">
            <v-text-field
              :model-value="getMovementTypeText(selectedMovement.movementType)"
              label="Tipo de Movimiento"
              readonly
              variant="outlined"
            />
          </v-col>
          <v-col cols="12" md="6">
            <v-text-field
              :model-value="selectedMovement.quantity"
              label="Cantidad"
              readonly
              variant="outlined"
            />
          </v-col>
          <v-col cols="12" md="6">
            <v-text-field
              :model-value="selectedMovement.previousStock"
              label="Stock Anterior"
              readonly
              variant="outlined"
            />
          </v-col>
          <v-col cols="12" md="6">
            <v-text-field
              :model-value="selectedMovement.newStock"
              label="Stock Nuevo"
              readonly
              variant="outlined"
            />
          </v-col>
          <v-col cols="12" md="6">
            <v-text-field
              :model-value="formatCurrency(selectedMovement.unitCost)"
              label="Costo Unitario"
              readonly
              variant="outlined"
            />
          </v-col>
          <v-col cols="12" md="6">
            <v-text-field
              :model-value="formatCurrency(selectedMovement.totalCost)"
              label="Costo Total"
              readonly
              variant="outlined"
            />
          </v-col>
          <v-col cols="12" md="6">
            <v-text-field
              :model-value="selectedMovement.reason"
              label="Motivo"
              readonly
              variant="outlined"
            />
          </v-col>
          <v-col cols="12" md="6">
            <v-text-field
              :model-value="formatDate(selectedMovement.movementDate)"
              label="Fecha del Movimiento"
              readonly
              variant="outlined"
            />
          </v-col>
          <v-col cols="12">
            <v-text-field
              :model-value="selectedMovement.notes"
              label="Notas"
              readonly
              variant="outlined"
            />
          </v-col>
          <v-col cols="12" md="6">
            <v-text-field
              :model-value="selectedMovement.user?.firstName + ' ' + selectedMovement.user?.lastName"
              label="Usuario"
              readonly
              variant="outlined"
            />
          </v-col>
          <v-col cols="12" md="6">
            <v-text-field
              :model-value="selectedMovement.referenceId ? 'Sí (' + selectedMovement.referenceId + ')' : 'No'"
              label="Referencia"
              readonly
              variant="outlined"
            />
          </v-col>
        </v-row>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn @click="closeMovementDetailsDialog">Cerrar</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import inventoryListLogic from './InventoryList.js'
import StockAdjustmentDialog from '@/components/inventory/StockAdjustmentDialog/StockAdjustmentDialog.vue'

export default {
  ...inventoryListLogic,
  components: {
    StockAdjustmentDialog
  }
}
</script>
