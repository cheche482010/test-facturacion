<template>
  <div>
    <!-- Header -->
    <div class="d-flex justify-space-between align-center mb-4">
      <div class="d-flex align-center">
        <v-btn icon="mdi-arrow-left" variant="text" to="/sales"></v-btn>
        <div class="ml-2">
          <h1 class="text-h5 font-weight-bold">Punto de Venta</h1>
          <p class="text-medium-emphasis">Cree una nueva factura para un cliente.</p>
        </div>
      </div>
      <div>
        <v-switch v-model="isFastSale" label="Venta Rápida (Bodega)" color="primary" density="compact" inset></v-switch>
        <v-btn color="error" variant="flat" @click="cancelSale">
          Cancelar Venta
        </v-btn>
      </div>
    </div>

    <v-row>
      <!-- Main Content -->
      <v-col cols="12" md="8">
        <!-- Customer Information -->
        <v-card class="mb-4">
          <v-card-item>
            <v-card-title>Información del Cliente</v-card-title>
          </v-card-item>
          <v-card-text>
            <v-row>
              <v-col cols="12" md="8">
                <v-autocomplete
                  v-model="selectedCustomerId"
                  :items="customers"
                  item-title="name"
                  item-value="id"
                  label="Busque o seleccione un cliente"
                  variant="solo-filled"
                  flat
                  prepend-inner-icon="mdi-account-search-outline"
                >
                  <template v-slot:item="{ props, item }">
                    <v-list-item v-bind="props" :title="item.raw.name" :subtitle="item.raw.idNumber" />
                  </template>
                </v-autocomplete>
              </v-col>
              <v-col cols="12" md="4">
                <v-btn block size="large" variant="tonal" @click="openCustomerDialog()">
                  + Nuevo Cliente
                </v-btn>
              </v-col>
            </v-row>
            <div v-if="selectedCustomer" class="mt-4 pa-4 border rounded">
              <p class="font-weight-bold">{{ selectedCustomer.name }}</p>
              <p><strong>CI/RIF:</strong> {{ selectedCustomer.idNumber }}</p>
              <p><strong>Email:</strong> {{ selectedCustomer.email }}</p>
              <p><strong>Teléfono:</strong> {{ selectedCustomer.phone }}</p>
            </div>
             <div v-else class="mt-4 pa-4 border rounded text-center text-medium-emphasis">
              Ningún cliente seleccionado
            </div>
          </v-card-text>
        </v-card>

        <!-- Product Search & Cart -->
        <v-card>
           <v-card-text>
            <v-text-field
              v-model="productSearch"
              label="Buscar producto por nombre, código o escanear..."
              variant="solo-filled"
              flat
              prepend-inner-icon="mdi-barcode-scan"
              @keydown.enter="addProductFromSearch"
              clearable
            />
          </v-card-text>
          <v-divider></v-divider>
          <v-card-item>
            <v-card-title>Carrito de Compras</v-card-title>
          </v-card-item>
          <div v-if="cartItems.length === 0" class="text-center py-12 text-medium-emphasis">
            <v-icon size="48" class="mb-2">mdi-cart-outline</v-icon>
            <p>El carrito está vacío</p>
          </div>
          <v-data-table
            v-else
            :headers="cartHeaders"
            :items="cartItems"
            item-key="id"
          >
             <template v-slot:item.name="{ item }">
              <div class="font-weight-bold">{{ item.name }}</div>
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
              <p>Subtotal</p>
              <p class="font-weight-bold">{{ formatCurrency(totals.subtotal) }}</p>
            </div>
            <div class="d-flex justify-space-between mb-2">
              <p>Descuento</p>
              <p class="font-weight-bold text-success">-{{ formatCurrency(totals.discount) }}</p>
            </div>
            <div class="d-flex justify-space-between mb-2">
              <p>IVA ({{ taxRate * 100 }}%)</p>
              <p class="font-weight-bold">{{ formatCurrency(totals.tax) }}</p>
            </div>
            <v-divider class="my-2"></v-divider>
            <div class="d-flex justify-space-between text-h6">
              <p class="font-weight-bold">Total</p>
              <p class="font-weight-bold">{{ formatCurrency(totals.total) }}</p>
            </div>

            <v-divider class="my-4"></v-divider>

            <v-text-field
              v-model.number="globalDiscount"
              label="Descuento Global ($)"
              type="number"
              min="0"
              variant="outlined"
              density="compact"
            ></v-text-field>

            <v-select
              v-model="paymentMethod"
              :items="paymentMethods"
              label="Método de Pago"
              variant="outlined"
              density="compact"
            ></v-select>

            <v-textarea
              v-model="notes"
              label="Añadir notas a la factura..."
              rows="3"
              variant="outlined"
              density="compact"
            ></v-textarea>
          </v-card-text>
          <v-divider></v-divider>
          <v-card-actions class="pa-4">
            <v-btn
              color="success"
              variant="flat"
              block
              size="large"
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