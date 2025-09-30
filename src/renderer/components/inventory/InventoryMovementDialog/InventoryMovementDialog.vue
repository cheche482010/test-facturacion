<template>
  <v-dialog v-model="dialog" max-width="800px" persistent>
    <v-card>
      <v-card-title>
        <span class="text-h5">Nuevo Movimiento de Inventario</span>
      </v-card-title>

      <v-card-text>
        <v-form ref="form" v-model="valid">
          <v-row>
            <!-- Product selection -->
            <v-col cols="12">
              <v-autocomplete
                v-model="selectedProduct"
                :items="products"
                item-title="name"
                item-value="id"
                label="Buscar Producto *"
                :rules="[rules.required]"
                variant="outlined"
                density="compact"
                return-object
                clearable
              >
                <template #item="{ props, item }">
                  <v-list-item v-bind="props" :title="item.raw.name">
                    <template #subtitle>
                      <span>{{ item.raw.internalCode }} - Stock: {{ item.raw.currentStock }}</span>
                    </template>
                  </v-list-item>
                </template>
              </v-autocomplete>
            </v-col>

            <!-- Movement details -->
            <v-col cols="12" md="6">
              <v-select
                v-model="formData.movementType"
                :items="movementTypes"
                label="Tipo de Movimiento *"
                :rules="[rules.required]"
                variant="outlined"
                density="compact"
              />
            </v-col>

            <v-col cols="12" md="6">
              <v-select
                v-model="formData.reason"
                :items="reasonOptions"
                label="Motivo *"
                :rules="[rules.required]"
                variant="outlined"
                density="compact"
              />
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field
                v-model.number="formData.quantity"
                label="Cantidad *"
                :rules="[rules.required, rules.positive]"
                variant="outlined"
                density="compact"
                type="number"
                :suffix="selectedProduct ? selectedProduct.unit : ''"
              />
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field
                v-model.number="formData.unitCost"
                label="Costo Unitario"
                variant="outlined"
                density="compact"
                type="number"
                prefix="$"
                :disabled="formData.movementType === 'salida'"
              />
            </v-col>

            <v-col cols="12">
              <v-textarea
                v-model="formData.notes"
                label="Notas Adicionales"
                variant="outlined"
                density="compact"
                rows="3"
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
          @click="saveMovement"
        >
          Guardar Movimiento
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import inventoryMovementDialogLogic from './InventoryMovementDialog.js'

export default inventoryMovementDialogLogic
</script>
