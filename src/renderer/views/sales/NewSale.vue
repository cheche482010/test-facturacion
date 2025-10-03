<template>
  <div>
    <h1 class="text-h4 mb-4">Nueva Venta (POS)</h1>

    <v-row>
      <!-- Columna principal de la venta -->
      <v-col cols="12" md="8">
        <v-card>
          <v-card-text>
            <!-- Escáner de código de barras -->
            <barcode-scanner @scanned="addProductByBarcode" class="mb-4" />

            <!-- Lista de productos en el carrito -->
            <v-data-table
              :headers="cartHeaders"
              :items="cartItems"
              item-key="id"
              no-data-text="Agregue productos a la venta"
            >
              <template v-slot:item.name="{ item }">
                <div>
                  <div class="font-weight-medium">{{ item.name }}</div>
                  <div class="text-caption">{{ item.internalCode }}</div>
                </div>
              </template>

              <template v-slot:item.quantity="{ item }">
                <v-text-field
                  v-model.number="item.quantity"
                  type="number" 
                  min="1"
                  :max="item.stock"
                  style="width: 100px"
                  density="compact"
                  variant="outlined"
                  hide-details
                  @change="updateQuantity(item)"
                />
              </template>

              <template v-slot:item.price="{ item }">
                {{ formatCurrency(item.price) }}
              </template>

              <template v-slot:item.subtotal="{ item }">
                <span class="font-weight-bold">
                  {{ formatCurrency(item.subtotal) }}
                </span>
              </template>

              <template v-slot:item.actions="{ item }">
                <v-btn icon="mdi-delete" variant="text" color="error" size="small" @click="removeItem(item)" />
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Columna de resumen y pago -->
      <v-col cols="12" md="4">
        <v-card>
          <v-card-title>Resumen de la Venta</v-card-title>
          <v-card-text>
            <!-- Selección de cliente -->
            <v-autocomplete
              v-if="appStore.operationMode === 'tienda'"
              v-model="selectedCustomerId"
              :items="customers"
              item-title="name"
              item-value="id"
              label="Cliente"
              variant="outlined"
              density="compact"
              class="mb-4"
            >
              <template v-slot:item="{ props, item }">
                <v-list-item v-bind="props" :subtitle="item.raw.idNumber" />
              </template>
            </v-autocomplete>

            <v-divider class="my-4" />

            <!-- Totales -->
            <div class="d-flex justify-space-between mb-2">
              <span>Subtotal:</span>
              <span>{{ formatCurrency(totals.subtotal) }}</span>
            </div>
            <div class="d-flex justify-space-between mb-2">
              <span>IVA (16%):</span>
              <span>{{ formatCurrency(totals.tax) }}</span>
            </div>
            <div class="d-flex justify-space-between text-h6 font-weight-bold">
              <span>Total:</span>
              <span>{{ formatCurrency(totals.total) }}</span>
            </div>
          </v-card-text>

          <v-card-actions>
            <v-btn
              color="primary"
              block
              large
              :disabled="cartItems.length === 0 || processingSale"
              :loading="processingSale"
              @click="processSale"
            >
              Procesar Venta
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script>
import newSaleLogic from './NewSale.js'

export default newSaleLogic
</script>

<style scoped src="./NewSale.scss"></style>