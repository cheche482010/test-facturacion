<template>
  <v-dialog v-model="dialog" max-width="800px" persistent>
    <v-card>
      <v-card-title>
        <span class="text-h5">
          {{ isEditing ? 'Editar Producto' : 'Nuevo Producto' }}
        </span>
      </v-card-title>

      <v-card-text>
        <v-form ref="form" v-model="valid">
          <v-row>
            <!-- Información básica -->
            <v-col cols="12">
              <h3 class="text-h6 mb-3">Información Básica</h3>
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field
                v-model="formData.internalCode"
                label="Código Interno *"
                :rules="[rules.required]"
                variant="outlined"
                density="compact"
              />
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field
                v-model="formData.barcode"
                label="Código de Barras"
                variant="outlined"
                density="compact"
                append-inner-icon="mdi-barcode-scan"
                @click:append-inner="scanBarcode"
              />
            </v-col>

            <v-col cols="12">
              <v-text-field
                v-model="formData.name"
                label="Nombre del Producto *"
                :rules="[rules.required]"
                variant="outlined"
                density="compact"
              />
            </v-col>

            <v-col cols="12">
              <v-textarea
                v-model="formData.description"
                label="Descripción"
                variant="outlined"
                density="compact"
                rows="2"
              />
            </v-col>

            <v-col cols="12" md="6">
              <v-select
                v-model="formData.categoryId"
                :items="categories"
                item-title="name"
                item-value="id"
                label="Categoría"
                variant="outlined"
                density="compact"
              />
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field
                v-model="formData.brand"
                label="Marca"
                variant="outlined"
                density="compact"
              />
            </v-col>

            <v-col cols="12" md="6">
              <v-select
                v-model="formData.unit"
                :items="unitOptions"
                label="Unidad de Medida"
                variant="outlined"
                density="compact"
              />
            </v-col>

            <v-col cols="12" md="6">
              <v-select
                v-model="formData.status"
                :items="statusOptions"
                label="Estado"
                variant="outlined"
                density="compact"
              />
            </v-col>

            <!-- Precios y costos -->
            <v-col cols="12">
              <h3 class="text-h6 mb-3 mt-4">Precios y Costos</h3>
            </v-col>

            <v-col cols="12" md="4">
              <v-text-field
                v-model.number="formData.costPrice"
                label="Costo de Compra *"
                :rules="[rules.required, rules.positive]"
                variant="outlined"
                density="compact"
                type="number"
                step="0.01"
                @input="calculatePrices"
              />
            </v-col>

            <v-col cols="12" md="4">
              <v-select
                v-model="formData.costCurrency"
                :items="currencyOptions"
                label="Moneda del Costo"
                variant="outlined"
                density="compact"
                @update:model-value="calculatePrices"
              />
            </v-col>

            <v-col cols="12" md="4">
              <v-text-field
                v-model.number="formData.profitPercentage"
                label="% Ganancia"
                variant="outlined"
                density="compact"
                type="number"
                step="0.01"
                suffix="%"
                @input="calculatePrices"
              />
            </v-col>

            <v-col cols="12" md="4">
              <v-text-field
                v-model.number="formData.retailPrice"
                label="Precio Detal"
                variant="outlined"
                density="compact"
                type="number"
                step="0.01"
                :readonly="autoPricing"
              />
            </v-col>

            <v-col cols="12" md="4">
              <v-text-field
                v-model.number="formData.wholesalePrice"
                label="Precio Mayorista"
                variant="outlined"
                density="compact"
                type="number"
                step="0.01"
                :readonly="autoPricing"
              />
            </v-col>

            <v-col cols="12" md="4">
              <v-text-field
                v-model.number="formData.dollar_price"
                label="Precio en USD"
                variant="outlined"
                density="compact"
                type="number"
                step="0.01"
              />
            </v-col>

            <v-col cols="12">
              <v-switch
                v-model="autoPricing"
                label="Cálculo automático de precios"
                color="primary"
                @update:model-value="calculatePrices"
              />
            </v-col>

            <!-- Impuestos -->
            <v-col cols="12" md="6">
              <v-text-field
                v-model.number="formData.taxRate"
                label="Tasa de IVA (%)"
                variant="outlined"
                density="compact"
                type="number"
                step="0.01"
                suffix="%"
              />
            </v-col>

            <!-- Inventario -->
            <v-col cols="12">
              <h3 class="text-h6 mb-3 mt-4">Control de Inventario</h3>
            </v-col>

            <v-col cols="12" md="4">
              <v-text-field
                v-model.number="formData.currentStock"
                label="Stock Actual"
                variant="outlined"
                density="compact"
                type="number"
                :readonly="isEditing"
              />
            </v-col>

            <v-col cols="12" md="4">
              <v-text-field
                v-model.number="formData.minStock"
                label="Stock Mínimo"
                variant="outlined"
                density="compact"
                type="number"
              />
            </v-col>

            <v-col cols="12" md="4">
              <v-text-field
                v-model.number="formData.maxStock"
                label="Stock Máximo"
                variant="outlined"
                density="compact"
                type="number"
              />
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field
                v-model="formData.location"
                label="Ubicación en Almacén"
                variant="outlined"
                density="compact"
              />
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field
                v-model="formData.expirationDate"
                label="Fecha de Vencimiento"
                variant="outlined"
                density="compact"
                type="date"
              />
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn @click="closeDialog">Cancelar</v-btn>
        <v-btn
          color="primary"
          :disabled="!valid"
          :loading="saving"
          @click="saveProduct"
        >
          {{ isEditing ? 'Actualizar' : 'Crear' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import productDialogLogic from './ProductDialog.js'

export default productDialogLogic
</script>
