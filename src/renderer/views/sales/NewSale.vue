<template>
  <div>
    <!-- Header -->
    <div class="d-flex justify-space-between align-center mb-4">
      <div class="d-flex align-center">

        <div class="ml-2">
          <h1 class="text-h5 font-weight-bold">Punto de Venta</h1>
          <p class="text-medium-emphasis">Cree una nueva factura para un cliente.</p>
        </div>
      </div>
      <div>
        <v-btn color="error" variant="flat" @click="cancelSale">
          Cancelar Venta
        </v-btn>
      </div>
    </div>

    <v-row>
      <!-- Main Content -->
      <v-col cols="12" md="8">
        <!-- Product Search & Cart -->
        <v-card>
          <v-card-text>
            <v-autocomplete 
              v-model="selectedProduct" 
              :items="filteredProducts" 
              :loading="searchLoading"
              :search="productSearch" 
              item-title="name" item-value="id"
              label="Buscar producto por nombre, código o escanear..." variant="solo-filled" flat
              prepend-inner-icon="mdi-barcode-scan" clearable return-object
              :no-data-text="productSearch ? 'No se encontraron productos' : 'Escribe para buscar productos...'"
              :menu-props="{ maxHeight: '400px' }" @focus="onSearchInput('')"
              @update:model-value="addProductFromAutocomplete" @update:search="onSearchInput">
              <template v-slot:item="{ props, item, index }">
                <v-list-item v-bind="props" :disabled="item.raw.currentStock <= 0">
                  <template v-slot:prepend>
                    <v-avatar size="32" rounded="sm" :color="item.raw.image ? 'transparent' : 'grey-lighten-2'">
                      <v-img v-if="item.raw.image" :src="`http://localhost:3001${item.raw.image}`" cover />
                      <v-icon v-else icon="mdi-camera-off" size="16" />
                    </v-avatar>
                  </template>
                  <v-list-item-title :class="item.raw.currentStock <= 0 ? 'text-error' : ''">{{ item.raw.name}}</v-list-item-title>
                  <v-list-item-subtitle :class="item.raw.currentStock <= 0 ? 'text-error' : ''">
                    Código: {{ item.raw.internalCode || 'N/A' }} |
                    Precio: {{ formatCurrency(item.raw.retailPrice, 'USD') }} |
                    Stock: <span :class="item.raw.currentStock <= 0 ? 'text-error font-weight-bold' : ''">
                      {{
                        item.raw.currentStock
                      }}</span>
                    <span v-if="item.raw.currentStock <= 0" class="text-error font-weight-bold">(SIN STOCK)</span>
                  </v-list-item-subtitle>
                </v-list-item>
                <v-divider v-if="index < filteredProducts.length - 1"></v-divider>
              </template>
            </v-autocomplete>
          </v-card-text>
          <v-divider></v-divider>
          <v-card-item>
            <v-card-title>Carrito de Compras</v-card-title>
          </v-card-item>
          <div v-if="cartItems.length === 0" class="text-center py-12 text-medium-emphasis">
            <v-icon size="48" class="mb-2">mdi-cart-outline</v-icon>
            <p>El carrito está vacío</p>
          </div>
          <v-data-table v-else :headers="cartHeaders" :items="cartItems" item-key="id">
            <template v-slot:item.name="{ item }">
              <div class="d-flex align-center">
                <v-avatar class="mr-3" size="40" rounded="sm" :color="item.image ? 'transparent' : 'grey-lighten-2'">
                  <v-img v-if="item.image" :src="`http://localhost:3001${item.image}`" :alt="item.name" cover />
                  <v-icon v-else icon="mdi-camera-off" />
                </v-avatar>
                <div class="font-weight-bold">{{ item.name }}</div>
              </div>
            </template>
            <template v-slot:item.quantity="{ item }">
              <v-text-field v-model.number="item.quantity" type="number" min="1" :max="item.stock" style="width: 100px"
                density="compact" variant="outlined" hide-details @change="updateQuantity(item)" />
            </template>
            <template v-slot:item.price="{ item }">
              <div>
                <div>$ {{ formatCurrency(item.price, 'USD').replace('$', '').trim() }}</div>
                <div class="text-caption text-medium-emphasis">{{ formatCurrency(item.price * currentDolarRate, 'VES')
                  }}</div>
              </div>
            </template>
            <template v-slot:item.subtotal="{ item }">
              <div>
                <div class="font-weight-bold">$ {{ formatCurrency(item.subtotal, 'USD').replace('$', '').trim() }}</div>
                <div class="text-caption text-medium-emphasis">{{ formatCurrency(item.subtotal * currentDolarRate,
                  'VES') }}</div>
              </div>
            </template>
            <template v-slot:item.actions="{ item }">
              <v-btn icon="mdi-delete" variant="text" color="error" size="small" @click="removeItem(item)" />
            </template>
          </v-data-table>
        </v-card>
      </v-col>

      <!-- Sale Summary -->
      <v-col cols="12" md="4">
        <v-card>
          <v-card-item>
            <v-card-title>Resumen de la Venta</v-card-title>
          </v-card-item>
          <v-card-text>
            <div class="d-flex justify-space-between mb-2">
              <p>Cantidad de productos</p>
              <p class="font-weight-bold">{{ cartItems.length }}</p>
            </div>
            <div class="d-flex justify-space-between mb-2 text-h5 font-weight-bold text-primary">
              <p>Tasa del día</p>
              <p>{{ formatCurrency(currentDolarRate, 'VES').replace('Bs.S', '').replace('Bs.', '').trim() }} Bs/USD</p>
            </div>
            <v-divider class="my-2"></v-divider>
            <div class="d-flex justify-space-between text-h6">
              <p class="font-weight-bold">Total USD</p>
              <p class="font-weight-bold">{{ formatCurrency(totals.totalUsd, 'USD') }}</p>
            </div>
            <div class="d-flex justify-space-between text-h6">
              <p class="font-weight-bold">Total Bs</p>
              <p class="font-weight-bold">{{ formatCurrency(totals.totalBs, 'VES') }}</p>
            </div>

            <v-divider class="my-4"></v-divider>

            <PaymentDialog v-model="showPaymentDialog" :sale-data="{
              items: cartItems,
              totalUsd: totals.totalUsd,
              totalBs: totals.totalBs
            }" @payment-completed="onPaymentCompleted" />

            <v-textarea v-model="notes" label="Añadir notas a la factura..." rows="3" variant="outlined"
              density="compact" class="mt-4"></v-textarea>
          </v-card-text>
          <v-divider></v-divider>
          <v-card-actions class="pa-4">
            <v-btn color="success" variant="flat" block size="large"
              :disabled="cartItems.length === 0 || processingSale" :loading="processingSale" @click="openPaymentDialog">
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
import PaymentDialog from '../../components/sales/PaymentDialog/PaymentDialog.vue'

export default {
  ...newSaleLogic,
  components: {
    PaymentDialog
  }
}
</script>

<style scoped src="./NewSale.scss"></style>
