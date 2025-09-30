<template>
  <v-dialog v-model="dialog" max-width="900px">
    <v-card>
      <v-card-title>
        <span class="text-h5">Historial de Movimientos</span>
        <v-spacer />
        <v-btn
          icon="mdi-close"
          variant="text"
          @click="closeDialog"
        />
      </v-card-title>

      <v-card-text>
        <div v-if="product" class="mb-4">
          <v-card variant="outlined">
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
                <v-spacer />
                <div class="text-right">
                  <div class="text-h6">{{ product.currentStock }} {{ product.unit }}</div>
                  <div class="text-caption">Stock actual</div>
                </div>
              </div>
            </v-card-text>
          </v-card>
        </div>

        <!-- Filtros -->
        <v-row class="mb-4">
          <v-col cols="12" md="4">
            <v-select
              v-model="selectedMovementType"
              :items="movementTypeOptions"
              label="Tipo de Movimiento"
              variant="outlined"
              density="compact"
              clearable
            />
          </v-col>
          <v-col cols="12" md="4">
            <v-text-field
              v-model="startDate"
              label="Fecha Desde"
              variant="outlined"
              density="compact"
              type="date"
            />
          </v-col>
          <v-col cols="12" md="4">
            <v-text-field
              v-model="endDate"
              label="Fecha Hasta"
              variant="outlined"
              density="compact"
              type="date"
            />
          </v-col>
        </v-row>

        <!-- Timeline de movimientos -->
        <v-timeline
          v-if="filteredMovements.length > 0"
          density="compact"
          class="mb-4"
        >
          <v-timeline-item
            v-for="movement in filteredMovements"
            :key="movement.id"
            :dot-color="getMovementColor(movement.movementType)"
            size="small"
          >
            <template v-slot:icon>
              <v-icon size="16">{{ getMovementIcon(movement.movementType) }}</v-icon>
            </template>

            <v-card variant="outlined" class="mb-2">
              <v-card-text class="py-2">
                <div class="d-flex justify-space-between align-center">
                  <div>
                    <div class="font-weight-medium">
                      {{ getMovementTypeText(movement.movementType) }}
                    </div>
                    <div class="text-caption text-medium-emphasis">
                      {{ getReasonText(movement.reason) }}
                    </div>
                  </div>
                  <div class="text-right">
                    <v-chip
                      :color="getMovementColor(movement.movementType)"
                      size="small"
                      variant="tonal"
                    >
                      {{ movement.movementType === 'entrada' ? '+' : '-' }}{{ movement.quantity }} {{ product.unit }}
                    </v-chip>
                    <div class="text-caption mt-1">
                      {{ formatDate(movement.movementDate) }}
                    </div>
                  </div>
                </div>

                <div class="d-flex justify-space-between align-center mt-2">
                  <div class="text-caption">
                    Stock: {{ movement.previousStock }} → {{ movement.newStock }}
                  </div>
                  <div class="text-caption">
                    {{ movement.user?.firstName }} {{ movement.user?.lastName }}
                  </div>
                </div>

                <div v-if="movement.notes" class="text-caption mt-1 text-medium-emphasis">
                  {{ movement.notes }}
                </div>
              </v-card-text>
            </v-card>
          </v-timeline-item>
        </v-timeline>

        <v-alert
          v-else
          type="info"
          variant="tonal"
        >
          No se encontraron movimientos para los filtros seleccionados.
        </v-alert>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn @click="exportMovements" prepend-icon="mdi-download">
          Exportar
        </v-btn>
        <v-btn color="primary" @click="closeDialog">
          Cerrar
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import movementHistoryDialogLogic from './MovementHistoryDialog.js'

export default movementHistoryDialogLogic
</script>
