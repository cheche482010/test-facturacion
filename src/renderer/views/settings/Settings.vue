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
                            <v-tab>General</v-tab>
                            <v-tab>Interfaz</v-tab>
                            <v-tab>Empresa</v-tab>
                            <v-tab>Facturación</v-tab>
                            <v-tab>Sistema</v-tab>
                        </v-tabs>

                        <v-window v-model="tab">
                            <!-- Configuración General -->
                            <v-window-item>
                                <v-container>
                                    <v-row>
                                        <v-col cols="12" md="6">
                                            <v-text-field v-model="settings.currency" label="Moneda"
                                                hint="Ej: USD, EUR, VES"></v-text-field>
                                        </v-col>
                                        <v-col cols="12" md="6">
                                            <v-text-field v-model="settings.language" label="Idioma"
                                                hint="Ej: es, en"></v-text-field>
                                        </v-col>
                                        <v-col cols="12" md="6">
                                            <v-text-field v-model="settings.timezone" label="Zona Horaria"
                                                hint="Ej: America/Caracas"></v-text-field>
                                        </v-col>
                                        <v-col cols="12" md="6">
                                            <v-text-field v-model="exchangeRate" label="Tasa de Cambio (BCV)"
                                                readonly></v-text-field>
                                        </v-col>
                                        <v-col cols="12" md="6">
                                            <v-btn color="secondary" @click="updateExchangeRate" :loading="isUpdatingRate">
                                                <v-icon left>mdi-update</v-icon>
                                                Actualizar Tasa
                                            </v-btn>
                                        </v-col>
                                    </v-row>
                                </v-container>
                            </v-window-item>

                            <!-- Interfaz Tab -->
                            <v-window-item>
                               <v-container>
                                    <v-row>
                                        <v-col cols="12" md="12">
                                            <v-text-field v-model="settings.companyName" label="Título del Sistema"></v-text-field>
                                        </v-col>
                                        <v-col cols="12">
                                            <v-file-input label="Logo de la Empresa" accept="image/*" @change="onLogoChange"></v-file-input>
                                        </v-col>
                                        <v-col cols="12"><v-divider class="my-2"></v-divider></v-col>
                                        <v-col cols="12" md="4">
                                            <v-switch v-model="settings.darkMode" label="Modo Oscuro" color="primary" inset></v-switch>
                                        </v-col>
                                        <v-col cols="12" md="8">
                                            <v-text-field v-model="settings.primaryColor" label="Color Primario" readonly>
                                                <template v-slot:append-inner>
                                                    <v-menu activator="parent" :close-on-content-click="false">
                                                      <v-color-picker v-model="settings.primaryColor"></v-color-picker>
                                                    </v-menu>
                                                    <v-avatar :color="settings.primaryColor" size="24"></v-avatar>
                                                </template>
                                            </v-text-field>
                                        </v-col>
                                    </v-row>
                                </v-container>
                            </v-window-item>

                            <!-- Configuración de Empresa -->
                            <v-window-item>
                                <v-container>
                                    <v-row>
                                        <v-col cols="12" md="6">
                                            <v-text-field v-model="settings.companyName" label="Nombre de la Empresa*"
                                                required></v-text-field>
                                        </v-col>
                                        <v-col cols="12" md="6">
                                            <v-text-field v-model="settings.companyRif" label="RIF/NIT"></v-text-field>
                                        </v-col>
                                        <v-col cols="12">
                                            <v-text-field v-model="settings.companyAddress"
                                                label="Dirección"></v-text-field>
                                        </v-col>
                                        <v-col cols="12" md="6">
                                            <v-text-field v-model="settings.companyPhone"
                                                label="Teléfono"></v-text-field>
                                        </v-col>
                                        <v-col cols="12" md="6">
                                            <v-text-field v-model="settings.companyEmail" label="Email"
                                                type="email"></v-text-field>
                                        </v-col>
                                    </v-row>
                                </v-container>
                            </v-window-item>

                            <!-- Configuración de Facturación -->
                            <v-window-item>
                                <v-container>
                                    <v-row>
                                        <v-col cols="12" md="6">
                                            <v-text-field v-model="settings.invoicePrefix" label="Prefijo de Factura"
                                                hint="Ej: FAC-"></v-text-field>
                                        </v-col>
                                        <v-col cols="12" md="6">
                                            <v-text-field v-model="settings.nextInvoiceNumber"
                                                label="Próximo Número de Factura" type="number"></v-text-field>
                                        </v-col>
                                        <v-col cols="12" md="6">
                                            <v-text-field v-model="settings.taxRate" label="Tasa de IVA (%)"
                                                type="number" step="0.01"></v-text-field>
                                        </v-col>
                                        <v-col cols="12" md="6">
                                            <v-switch v-model="settings.autoCalculateTax"
                                                label="Calcular IVA automáticamente"></v-switch>
                                        </v-col>
                                    </v-row>
                                </v-container>
                            </v-window-item>

                            <!-- Configuración del Sistema -->
                            <v-window-item>
                                <v-container>
                                    <v-row>
                                        <v-col cols="12" md="6">
                                            <v-switch v-model="settings.autoBackup"
                                                label="Respaldo automático"></v-switch>
                                        </v-col>
                                        <v-col cols="12" md="6">
                                            <v-text-field v-model="settings.backupInterval"
                                                label="Intervalo de respaldo (horas)" type="number"
                                                :disabled="!settings.autoBackup"></v-text-field>
                                        </v-col>
                                        <v-col cols="12" md="6">
                                            <v-text-field v-model="settings.openingTime" label="Hora de apertura"
                                                type="time" hint="Usado para el arqueo diario"></v-text-field>
                                        </v-col>
                                        <v-col cols="12">
                                            <v-btn color="primary" @click="createBackup">
                                                <v-icon left>mdi-backup-restore</v-icon>
                                                Crear Respaldo Manual
                                            </v-btn>
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
<style scoped>
.v-btn {
    margin-top: 10px;
}
</style>
