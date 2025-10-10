<template>
  <div>
    <!-- Header -->
    <div class="d-flex justify-space-between align-center mb-4">
      <div>
        <h1 class="text-h5 font-weight-bold">Gestión de Productos</h1>
        <p class="text-medium-emphasis">Administra tu catálogo de productos y controla el inventario</p>
      </div>
      <v-btn v-if="!isCajero" color="primary" prepend-icon="mdi-plus" @click="openProductDialog()">
        Nuevo Producto
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

    <!-- Filtros y búsqueda -->
    <v-card class="mt-4">
      <v-card-text>
        <v-row class="d-flex align-center">
          <v-col cols="12" md="5">
            <v-text-field v-model="search" label="Buscar por nombre, código o código de barras..."
              prepend-inner-icon="mdi-magnify" variant="solo-filled" density="compact" flat clearable />
          </v-col>
          <v-col cols="12" md="3">
            <v-select v-model="selectedCategory" :items="categories" item-title="name" item-value="id" label="Categoría"
              variant="solo-filled" density="compact" flat clearable />
          </v-col>
          <v-col cols="12" md="2">
            <v-select v-model="selectedStatus" :items="statusOptions" item-title="title" item-value="value"
              label="Estado" variant="solo-filled" density="compact" flat clearable />
          </v-col>
          <v-col cols="12" md="2">
            <v-checkbox v-model="stockFilter" label="Solo stock bajo" density="compact"></v-checkbox>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Tabla de productos -->
    <v-card class="mt-4">
      <v-card-item>
        <v-card-title>
          Lista de Productos ({{ filteredProducts.length }})
        </v-card-title>
      </v-card-item>
      <v-data-table :headers="headers" :items="filteredProducts" :loading="loading" item-value="id" hover>
        <template v-slot:item.image="{ item }">
          <v-avatar
            class="ma-2"
            size="40"
            rounded="sm"
            :color="item.image ? 'transparent' : 'grey-lighten-2'"
            :style="{ cursor: item.image ? 'pointer' : 'default' }"
            @click="item.image && showImage(item)"
          >
            <v-img
              v-if="item.image"
              :src="`http://localhost:3001${item.image}`"
              :alt="item.name"
              cover
            />
            <v-icon v-else icon="mdi-camera-off" />
          </v-avatar>
        </template>
        <template v-slot:item.name="{ item }">
          <div>
            <div class="font-weight-bold">{{ item.name }}</div>
            <div class="text-caption text-medium-emphasis">{{ item.brand || '' }}</div>
          </div>
        </template>

        <template v-slot:item.categoryName="{ item }">
          <v-chip size="small" variant="tonal" :text="item.categoryName" />
        </template>

        <template v-slot:item.currentStock="{ item }">
          <div class="d-flex align-center" :class="getStockColor(item)">
            <v-icon v-if="item.currentStock > 0 && item.currentStock <= item.minStock" size="small"
              class="mr-1">mdi-alert</v-icon>
            <span>{{ item.currentStock }}</span>
          </div>
        </template>

        <template v-slot:item.retailPrice="{ item }">
          <div class="font-weight-bold">{{ formatCurrency(item.retailPrice) }}</div>
        </template>

        <template v-slot:item.status="{ item }">
          <v-chip :color="getStatusColor(item.status)" size="small" variant="flat" label>
            {{ getStatusText(item.status) }}
          </v-chip>
        </template>

        <template v-if="!isCajero" v-slot:item.actions="{ item }">
          <v-btn icon="mdi-pencil" size="x-small" variant="text" @click="openProductDialog(item)"></v-btn>
          <v-btn icon="mdi-delete" size="x-small" variant="text" color="error" @click="confirmDelete(item)"></v-btn>
        </template>
      </v-data-table>
    </v-card>

    <!-- Dialog para crear/editar producto -->
    <ProductDialog v-model="productDialog" :product="selectedProduct" :categories="categories"
      @saved="onProductSaved" />

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

    <!-- Dialog para mostrar imagen en grande -->
    <v-dialog v-model="imageDialog" max-width="600">
      <v-card>
        <v-card-text>
          <v-img
            :src="`http://localhost:3001${selectedProductImage}`"
            contain
            max-height="500"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="imageDialog = false">Cerrar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import productListLogic from './ProductList.js'

export default productListLogic
</script>
<style scoped src="./ProductList.scss"></style>