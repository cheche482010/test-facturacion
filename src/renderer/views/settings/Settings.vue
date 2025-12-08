<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title>
            <span class="text-h5">Configuración del Sistema</span>
          </v-card-title>

          <v-card-text>
            <v-tabs v-model="tab">
              <v-tab v-for="tabItem in availableTabs" :key="tabItem.index">{{ tabItem.name }}</v-tab>
            </v-tabs>

            <v-window v-model="currentWindowIndex">
              <!-- Interfaz Tab -->
              <v-window-item>
                <v-container>
                  <v-row>
                    <v-col cols="12" md="12">
                      <v-text-field v-model="settings.system_title" label="Título del Sistema"></v-text-field>
                    </v-col>
                    <v-col cols="12">
                      <v-file-input label="Logo del Sistema" accept="image/*" @change="onLogoChange"></v-file-input>
                      <v-img v-if="settings.system_logo" :src="settings.system_logo" max-height="100" contain></v-img>
                      <v-icon v-else size="100" color="grey">mdi-store-outline</v-icon>
                    </v-col>
                    <v-col cols="12"><v-divider class="my-2"></v-divider></v-col>
                    <v-col cols="12" md="6">
                      <v-text-field v-model="settings.primary_color" label="Color Primario" readonly>
                        <template v-slot:append-inner>
                          <v-menu activator="parent" :close-on-content-click="false">
                            <v-color-picker v-model="settings.primary_color"></v-color-picker>
                          </v-menu>
                          <v-avatar :color="settings.primary_color" size="24"></v-avatar>
                        </template>
                      </v-text-field>
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-text-field v-model="settings.secondary_color" label="Color Secundario" readonly>
                        <template v-slot:append-inner>
                          <v-menu activator="parent" :close-on-content-click="false">
                            <v-color-picker v-model="settings.secondary_color"></v-color-picker>
                          </v-menu>
                          <v-avatar :color="settings.secondary_color" size="24"></v-avatar>
                        </template>
                      </v-text-field>
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-switch v-model="settings.dark_mode" label="Modo Oscuro" color="primary" inset></v-switch>
                    </v-col>
                    <v-col cols="12"><v-divider class="my-2"></v-divider></v-col>
                    <v-col cols="12">
                      <h3 class="text-h6 mb-3">Configuración de Fuentes</h3>
                    </v-col>
                    <v-col cols="12" md="4">
                      <v-select v-model="settings.fonts_title.font" :items="fontOptions"
                        label="Fuente Título"></v-select>
                      <v-text-field v-model="settings.fonts_title.size" label="Tamaño Título"
                        placeholder="24px"></v-text-field>
                    </v-col>
                    <v-col cols="12" md="4">
                      <v-select v-model="settings.fonts_subtitle.font" :items="fontOptions"
                        label="Fuente Subtítulo"></v-select>
                      <v-text-field v-model="settings.fonts_subtitle.size" label="Tamaño Subtítulo"
                        placeholder="18px"></v-text-field>
                    </v-col>
                    <v-col cols="12" md="4">
                      <v-select v-model="settings.fonts_text.font" :items="fontOptions" label="Fuente Texto"></v-select>
                      <v-text-field v-model="settings.fonts_text.size" label="Tamaño Texto"
                        placeholder="14px"></v-text-field>
                    </v-col>
                  </v-row>
                </v-container>
              </v-window-item>

              <!-- Configuración de Empresa -->
              <v-window-item>
                <v-container>
                  <v-row>
                    <v-col cols="12" md="6">
                      <v-text-field v-model="settings.company_name" label="Nombre de la Empresa*"
                        required></v-text-field>
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-text-field v-model="settings.company_rif" label="RIF/NIT"></v-text-field>
                    </v-col>
                    <v-col cols="12">
                      <v-text-field v-model="settings.company_address" label="Dirección"></v-text-field>
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-text-field v-model="settings.company_phone" label="Teléfono"></v-text-field>
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-text-field v-model="settings.company_email" label="Email" type="email"></v-text-field>
                    </v-col>
                  </v-row>
                </v-container>
              </v-window-item>

              <!-- Configuración del Dólar -->
              <v-window-item>
                <v-container>
                  <v-row>
                    <v-col cols="12">
                      <v-card-title>
                        <span class="text-h6">Tasa del Dólar Actual</span>
                      </v-card-title>
                      <v-card-text>
                        <v-row>
                          <v-col cols="12" md="4">
                            <v-text-field :model-value="currentDolarRate.rate" label="Tasa Actual (Bs)" readonly
                              :loading="loadingDolarRate"></v-text-field>
                          </v-col>
                          <v-col cols="12" md="4">
                            <v-text-field :model-value="currentDolarRate.date" label="Fecha de Actualización"
                              readonly></v-text-field>
                          </v-col>
                          <v-col cols="12" md="4">
                            <v-btn color="secondary" @click="fetchDolarRate" :loading="updatingDolarRate">
                              <v-icon left>mdi-update</v-icon>
                              Actualizar desde API
                            </v-btn>
                          </v-col>
                        </v-row>
                      </v-card-text>
                    </v-col>

                    <v-col cols="12">
                      <v-card-title>
                        <span class="text-h6">Actualización Manual</span>
                      </v-card-title>
                      <v-card-text>
                        <v-row>
                          <v-col cols="12" md="4">
                            <v-text-field v-model="manualRate" label="Nueva Tasa (Bs)" type="number"
                              step="0.01"></v-text-field>
                          </v-col>
                          <v-col cols="12" md="4">
                            <v-text-field v-model="manualDate" label="Fecha (opcional)" type="date"></v-text-field>
                          </v-col>
                          <v-col cols="12" md="4">
                            <v-btn color="primary" @click="updateManualRate" :loading="updatingManualRate">
                              <v-icon left>mdi-content-save</v-icon>
                              Actualizar Manualmente
                            </v-btn>
                          </v-col>
                        </v-row>
                      </v-card-text>
                    </v-col>

                    <v-col cols="12">
                      <v-card-title>
                        <span class="text-h6">Historial de Tasas</span>
                      </v-card-title>
                      <v-card-text>
                        <v-data-table :headers="dolarHeaders" :items="dolarHistory" :loading="loadingHistory"
                          item-key="id" class="elevation-1">
                          <template v-slot:item.rate="{ item }">
                            {{ formatCurrency(item.dataValues ? item.dataValues.rate :
                              item.rate) }}
                          </template>
                          <template v-slot:item.date="{ item }">
                            {{ formatDate(item.dataValues ? item.dataValues.date :
                              item.date) }}
                          </template>
                          <template v-slot:item.updatedAt="{ item }">
                            {{ formatDateTime(item.dataValues ?
                              item.dataValues.updatedAt : item.updatedAt) }}
                          </template>
                          <template v-slot:item.source="{ item }">
                            {{ item.dataValues ? item.dataValues.source : item.source }}
                          </template>
                        </v-data-table>
                      </v-card-text>
                    </v-col>
                  </v-row>
                </v-container>
              </v-window-item>
            </v-window>
          </v-card-text>

          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="primary" @click="saveSettings" :loading="saving">
              <v-icon left>mdi-content-save</v-icon>
              Guardar Configuración
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import settingsLogic from './Settings.js'

export default settingsLogic
</script>
