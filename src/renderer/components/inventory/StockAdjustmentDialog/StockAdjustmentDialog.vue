<template>
  <v-dialog v-model="dialog" max-width="600px" persistent>
    <v-card>
      <v-card-title>
        <span class="text-h5">
          {{ product ? 'Ajustar Stock' : 'Ajuste Masivo de Stock' }}
        </span>
      </v-card-title>

      <v-card-text>
        <v-form ref="form" v-model="valid">
          <div>
            <!-- Ajuste individual -->
            <v-row v-if="product">
              <v-col cols="12">
                <v-card variant="outlined" class="mb-4">
                  <v-card-text>
                    <div class="d-flex align-center">
                      <v-avatar size="40" class="mr-3">
                        <v-img
                          v-if="product.image"
                          :src="product.image"
                          alt="Producto"
                        />
                        <v-icon v-else>mdi-package-variant</v-icon>
                      </v-avatar>
                      <div>
                        <div class="font-weight-medium">{{ product.name }}</div>
                        <div class="text-caption">{{ product.internalCode }}</div>
                      </div>
                    </div>
                  </v-card-text>
                </v-card>
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  :model-value="product.currentStock"
                  label="Stock Actual"
                  variant="outlined"
                  density="compact"
                  readonly
                  :suffix="product.unit"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model.number="formData.newStock"
                  label="Nuevo Stock *"
                  :rules="[rules.required, rules.positive]"
                  variant="outlined"
                  density="compact"
                  type="number"
                  :suffix="product.unit"
                />
              </v-col>

              <v-col cols="12">
                <v-select
                  v-model="formData.reason"
                  :items="reasonOptions"
                  label="Motivo del Ajuste *"
                  :rules="[rules.required]"
                  variant="outlined"
                  density="compact"
                />
              </v-col>

              <v-col cols="12">
                <v-textarea
                  v-model="formData.notes"
                  label="Notas"
                  variant="outlined"
                  density="compact"
                  rows="2"
                />
              </v-col>

              <v-col cols="12">
                <v-alert
                  :type="adjustmentType"
                  variant="tonal"
                  class="mb-0"
                >
                  <div class="d-flex justify-space-between align-center">
                    <span>
                      {{ adjustmentMessage }}
                    </span>
                    <v-chip
                      :color="adjustmentType"
                      size="small"
                    >
                      {{ adjustmentQuantity > 0 ? '+' : '' }}{{ adjustmentQuantity }} {{ product.unit }}
                    </v-chip>
                  </div>
                </v-alert>
              </v-col>
            </v-row>

            <!-- Ajuste masivo -->
            <v-row v-else>
                <v-col cols="12">
                  <v-select
                    v-model="formData.category"
                    :items="categories"
                    item-title="name"
                    item-value="id"
                    label="Categoría"
                    variant="outlined"
                    density="compact"
                    clearable
                  />
                </v-col>

                <v-col cols="12" md="6">
                  <v-select
                    v-model="formData.adjustmentType"
                    :items="massAdjustmentTypes"
                    label="Tipo de Ajuste *"
                    :rules="[rules.required]"
                    variant="outlined"
                    density="compact"
                  />
                </v-col>

                <v-col cols="12" md="6">
                  <v-text-field
                    v-model.number="formData.adjustmentValue"
                    label="Valor"
                    :rules="[rules.required]"
                    variant="outlined"
                    density="compact"
                    type="number"
                    :suffix="formData.adjustmentType === 'percentage' ? '%' : 'unidades'"
                  />
                </v-col>

                <v-col cols="12">
                  <v-select
                    v-model="formData.reason"
                    :items="reasonOptions"
                    label="Motivo del Ajuste *"
                    :rules="[rules.required]"
                    variant="outlined"
                    density="compact"
                  />
                </v-col>

                <v-col cols="12">
                  <v-textarea
                    v-model="formData.notes"
                    label="Notas"
                    variant="outlined"
                    density="compact"
                    rows="2"
                  />
                </v-col>
            </v-row>
          </div>
        </v-form>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn @click="closeDialog">Cancelar</v-btn>
        <v-btn
          color="primary"
          :disabled="!valid"
          :loading="saving"
          @click="saveAdjustment"
        >
          Aplicar Ajuste
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import stockAdjustmentDialogLogic from './StockAdjustmentDialog.js'

export default stockAdjustmentDialogLogic
</script>
