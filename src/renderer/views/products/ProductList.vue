<template>
  <div>
    <v-row class="mb-4">
      <v-col cols="12" md="6">
        <h1 class="text-h4">Gestión de Productos</h1>
      </v-col>
      <v-col cols="12" md="6" class="text-right">
        <v-btn
          color="primary"
          @click="openProductDialog()"
          prepend-icon="mdi-plus"
        >
          Nuevo Producto
        </v-btn>
      </v-col>
    </v-row>

    <!-- Filtros y búsqueda -->
    <v-card class="mb-4">
      <v-card-text>
        <v-row>
          <v-col cols="12" md="4">
            <v-text-field
              v-model="search"
              label="Buscar productos"
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              density="compact"
              clearable
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-select
              v-model="selectedCategory"
              :items="categories"
              item-title="name"
              item-value="id"
              label="Categoría"
              variant="outlined"
              density="compact"
              clearable
            />
          </v-col>
          <v-col cols="12" md="2">
            <v-select
              v-model="selectedStatus"
              :items="statusOptions"
              label="Estado"
              variant="outlined"
              density="compact"
              clearable
            />
          </v-col>
          <v-col cols="12" md="2">
            <v-select
              v-model="stockFilter"
              :items="stockFilterOptions"
              label="Stock"
              variant="outlined"
              density="compact"
              clearable
            />
          </v-col>
          <v-col cols="12" md="1">
            <v-btn
              icon="mdi-refresh"
              @click="loadProducts"
              variant="outlined"
            />
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Tabla de productos -->
    <v-card>
      <v-data-table
        :headers="headers"
        :items="filteredProducts"
        :loading="loading"
        :search="search"
        class="elevation-1"
      >
        <template v-slot:item.image="{ item }">
          <v-avatar size="40" class="my-2">
            <v-img
              v-if="item.image"
              :src="item.image"
              alt="Producto"
            />
            <v-icon v-else>mdi-package-variant</v-icon>
          </v-avatar>
        </template>

        <template v-slot:item.name="{ item }">
          <div>
            <div class="font-weight-medium">{{ item.name }}</div>
            <div class="text-caption text-medium-emphasis">
              Código: {{ item.internalCode }}
            </div>
          </div>
        </template>

        <template v-slot:item.category="{ item }">
          <v-chip
            v-if="item.category"
            size="small"
            color="primary"
            variant="tonal"
          >
            {{ item.category.name }}
          </v-chip>
        </template>

        <template v-slot:item.currentStock="{ item }">
          <v-chip
            :color="getStockColor(item)"
            size="small"
            variant="tonal"
          >
            {{ item.currentStock }} {{ item.unit }}
          </v-chip>
        </template>

        <template v-slot:item.retailPrice="{ item }">
          <div class="text-right">
            <div class="font-weight-medium">
              {{ formatCurrency(item.retailPrice) }}
            </div>
            <div class="text-caption text-medium-emphasis">
              Costo: {{ formatCurrency(item.costPrice) }}
            </div>
          </div>
        </template>

        <template v-slot:item.status="{ item }">
          <v-chip
            :color="getStatusColor(item.status)"
            size="small"
            variant="tonal"
          >
            {{ getStatusText(item.status) }}
          </v-chip>
        </template>

        <template v-slot:item.actions="{ item }">
          <v-btn
            icon="mdi-pencil"
            size="small"
            variant="text"
            @click="openProductDialog(item)"
          />
          <v-btn
            icon="mdi-barcode"
            size="small"
            variant="text"
            @click="generateBarcode(item)"
          />
          <v-btn
            icon="mdi-delete"
            size="small"
            variant="text"
            color="error"
            @click="confirmDelete(item)"
          />
        </template>
      </v-data-table>
    </v-card>

    <!-- Dialog para crear/editar producto -->
    <ProductDialog
      v-model="productDialog"
      :product="selectedProduct"
      :categories="categories"
      @saved="onProductSaved"
    />

    <!-- Dialog de confirmación de eliminación -->
    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card>
        <v-card-title>Confirmar eliminación</v-card-title>
        <v-card-text>
          ¿Está seguro que desea eliminar el producto "{{ productToDelete?.name }}"?
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="deleteDialog = false">Cancelar</v-btn>
          <v-btn color="error" @click="deleteProduct">Eliminar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog para mostrar código de barras -->
    <v-dialog v-model="barcodeDialog" max-width="400">
      <v-card>
        <v-card-title>Código de Barras</v-card-title>
        <v-card-text class="text-center">
          <div id="barcode-container" class="mb-4"></div>
          <div class="text-h6">{{ selectedProduct?.barcode }}</div>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="barcodeDialog = false">Cerrar</v-btn>
          <v-btn color="primary" @click="printBarcode">Imprimir</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import productListLogic from './ProductList.js'

export default productListLogic
</script>

<style lang="scss" scoped>
@import './ProductList.scss';
</style>
