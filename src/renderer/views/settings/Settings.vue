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
                            <v-tab>Empresa</v-tab>
                            <v-tab>Facturación</v-tab>
                            <v-tab>Modo de Operación</v-tab>
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
                                            <v-select v-model="settings.theme" :items="themeOptions"
                                                label="Tema"></v-select>
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

                            <!-- Modo de Operación -->
                            <v-window-item>
                                <v-container>
                                    <v-row>
                                        <v-col cols="12" md="6">
                                            <v-select v-model="settings.operationMode" :items="operationModeOptions"
                                                label="Modo de Operación"></v-select>
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
