<template>
  <div>
    <!-- Header -->
    <div class="d-flex justify-space-between align-center mb-4">
      <div>
        <h1 class="text-h5 font-weight-bold">Configuración del Sistema</h1>
        <p class="text-medium-emphasis">Personaliza la apariencia y configuración del sistema</p>
      </div>
      <v-btn color="primary" prepend-icon="mdi-content-save" @click="saveSettings" :loading="saving">
        Guardar Cambios
      </v-btn>
    </div>

    <v-row>
      <!-- Left Column -->
      <v-col cols="12" md="7">
        <!-- Company Information -->
        <v-card class="mb-4">
          <v-card-item>
            <v-card-title>
              <v-icon start icon="mdi-domain"></v-icon>
              Información de la Empresa
            </v-card-title>
          </v-card-item>
          <v-card-text>
            <v-row>
              <v-col cols="12" sm="6">
                <v-text-field v-model="settings.companyName" label="Nombre del Sistema"></v-text-field>
              </v-col>
               <v-col cols="12" sm="6">
                <v-text-field v-model="settings.companySlogan" label="Nombre de la Empresa"></v-text-field>
              </v-col>
              <v-col cols="12">
                 <v-file-input
                  label="Logo de la Empresa"
                  accept="image/*"
                  prepend-icon="mdi-camera"
                  @change="onLogoChange"
                ></v-file-input>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

        <!-- Billing Configuration -->
        <v-card>
          <v-card-item>
            <v-card-title>
              <v-icon start icon="mdi-file-document-outline"></v-icon>
              Configuración de Facturación
            </v-card-title>
          </v-card-item>
          <v-card-text>
            <v-row>
              <v-col cols="12" sm="6">
                <v-text-field v-model="settings.currencySymbol" label="Símbolo de Moneda"></v-text-field>
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field v-model.number="settings.taxRate" label="Tasa de IVA por Defecto (%)" type="number"></v-text-field>
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field v-model="settings.invoicePrefix" label="Prefijo de Facturas"></v-text-field>
              </v-col>
              <v-col cols="12" sm="6">
                <v-select v-model="settings.defaultSaleMode" :items="['Venta por Tienda (Con clientes)', 'Venta Rápida (Bodega)']" label="Modo de Venta por Defecto"></v-select>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Right Column -->
      <v-col cols="12" md="5">
        <!-- Theme and Colors -->
        <v-card class="mb-4">
          <v-card-item>
            <v-card-title>
              <v-icon start icon="mdi-palette-outline"></v-icon>
              Tema y Colores
            </v-card-title>
          </v-card-item>
          <v-card-text>
            <p class="font-weight-medium">Color Primario</p>
            <v-color-picker v-model="settings.primaryColor" :swatches="colorSwatches" show-swatches hide-inputs></v-color-picker>

            <p class="mt-4 font-weight-medium">Color Secundario</p>
            <v-text-field v-model="settings.secondaryColor" label="Color Secundario"></v-text-field>

            <p class="mt-4 font-weight-medium">Color de Acento</p>
            <v-text-field v-model="settings.accentColor" label="Color de Acento"></v-text-field>

            <v-switch v-model="settings.darkMode" label="Modo Oscuro por Defecto" color="primary" inset></v-switch>
          </v-card-text>
        </v-card>

        <!-- System Preview -->
        <v-card>
           <v-card-item>
            <v-card-title>
              <v-icon start icon="mdi-monitor-eye"></v-icon>
              Vista Previa del Sistema
            </v-card-title>
          </v-card-item>
          <v-card-text>
            <v-card :color="settings.primaryColor" class="d-flex align-center pa-2">
                <v-avatar color="white" size="32" class="mr-3">
                  <v-icon :color="settings.primaryColor">mdi-store</v-icon>
                </v-avatar>
                <div>
                  <p class="font-weight-bold text-white">{{ settings.companyName }}</p>
                  <p class="text-caption text-white">{{ settings.companySlogan }}</p>
                </div>
            </v-card>
            <v-btn :color="settings.primaryColor" class="mt-4" block>Botón Primario</v-btn>
            <p class="text-center mt-2 text-caption">Moneda: {{ settings.currencySymbol }} | IVA: {{ settings.taxRate }}%</p>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script>
import settingsLogic from './Settings.js'

export default settingsLogic
</script>