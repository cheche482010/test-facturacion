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
                            <v-tab>Sistema</v-tab>
                        </v-tabs>

                        <v-tabs-items v-model="tab">
                            <!-- Configuración General -->
                            <v-tab-item>
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
                            </v-tab-item>

                            <!-- Configuración de Empresa -->
                            <v-tab-item>
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
                            </v-tab-item>

                            <!-- Configuración de Facturación -->
                            <v-tab-item>
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
                            </v-tab-item>

                            <!-- Configuración del Sistema -->
                            <v-tab-item>
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
                            </v-tab-item>
                        </v-tabs-items>
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
import { ref, onMounted } from 'vue'

export default {
    name: 'Settings',
    setup() {
        const tab = ref(0)
        const saving = ref(false)

        const settings = ref({
            currency: 'USD',
            language: 'es',
            timezone: 'America/Caracas',
            theme: 'light',
            companyName: '',
            companyRif: '',
            companyAddress: '',
            companyPhone: '',
            companyEmail: '',
            invoicePrefix: 'FAC-',
            nextInvoiceNumber: 1,
            taxRate: 16,
            autoCalculateTax: true,
            autoBackup: false,
            backupInterval: 24
        })

        const themeOptions = [
            { text: 'Claro', value: 'light' },
            { text: 'Oscuro', value: 'dark' }
        ]

        const loadSettings = async () => {
            try {
                const response = await window.electronAPI.invoke('get-settings')
                if (response && response.length > 0) {
                    response.forEach(setting => {
                        if (settings.value.hasOwnProperty(setting.key)) {
                            settings.value[setting.key] = setting.value
                        }
                    })
                }
            } catch (error) {
                console.error('Error loading settings:', error)
            }
        }

        const saveSettings = async () => {
            saving.value = true
            try {
                const settingsArray = Object.entries(settings.value).map(([key, value]) => ({
                    key,
                    value: value.toString()
                }))

                await window.electronAPI.invoke('save-settings', settingsArray)
                // Mostrar mensaje de éxito
            } catch (error) {
                console.error('Error saving settings:', error)
            } finally {
                saving.value = false
            }
        }

        const createBackup = async () => {
            try {
                await window.electronAPI.invoke('create-backup')
                // Mostrar mensaje de éxito
            } catch (error) {
                console.error('Error creating backup:', error)
            }
        }

        onMounted(() => {
            loadSettings()
        })

        return {
            tab,
            saving,
            settings,
            themeOptions,
            saveSettings,
            createBackup
        }
    }
}
</script>
