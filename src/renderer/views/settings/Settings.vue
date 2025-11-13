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
                                            <v-btn color="secondary" @click="updateExchangeRate"
                                                :loading="isUpdatingRate">
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
                                            <v-text-field v-model="settings.systemTitle"
                                                label="Título del Sistema"></v-text-field>
                                        </v-col>
                                        <v-col cols="12">
                                            <v-file-input label="Logo del Sistema" accept="image/*"
                                                @change="onLogoChange"></v-file-input>
                                            <v-img v-if="settings.systemLogo" :src="settings.systemLogo"
                                                max-height="100" contain></v-img>
                                            <v-icon v-else size="100" color="grey">mdi-store-outline</v-icon>
                                        </v-col>
                                        <v-col cols="12"><v-divider class="my-2"></v-divider></v-col>
                                        <v-col cols="12" md="6">
                                            <v-text-field v-model="settings.primaryColor" label="Color Primario"
                                                readonly>
                                                <template v-slot:append-inner>
                                                    <v-menu activator="parent" :close-on-content-click="false">
                                                        <v-color-picker
                                                            v-model="settings.primaryColor"></v-color-picker>
                                                    </v-menu>
                                                    <v-avatar :color="settings.primaryColor" size="24"></v-avatar>
                                                </template>
                                            </v-text-field>
                                        </v-col>
                                        <v-col cols="12" md="6">
                                            <v-text-field v-model="settings.secondaryColor" label="Color Secundario"
                                                readonly>
                                                <template v-slot:append-inner>
                                                    <v-menu activator="parent" :close-on-content-click="false">
                                                        <v-color-picker
                                                            v-model="settings.secondaryColor"></v-color-picker>
                                                    </v-menu>
                                                    <v-avatar :color="settings.secondaryColor" size="24"></v-avatar>
                                                </template>
                                            </v-text-field>
                                        </v-col>
                                        <v-col cols="12" md="6">
                                            <v-switch v-model="settings.darkMode" label="Modo Oscuro" color="primary"
                                                inset></v-switch>
                                        </v-col>
                                        <v-col cols="12"><v-divider class="my-2"></v-divider></v-col>
                                        <v-col cols="12">
                                            <h3 class="text-h6 mb-3">Configuración de Fuentes</h3>
                                        </v-col>
                                        <v-col cols="12" md="4">
                                            <v-select v-model="settings.fontsTitle.font" :items="fontOptions"
                                                label="Fuente Título"></v-select>
                                            <v-text-field v-model="settings.fontsTitle.size" label="Tamaño Título"
                                                placeholder="24px"></v-text-field>
                                        </v-col>
                                        <v-col cols="12" md="4">
                                            <v-select v-model="settings.fontsSubtitle.font" :items="fontOptions"
                                                label="Fuente Subtítulo"></v-select>
                                            <v-text-field v-model="settings.fontsSubtitle.size" label="Tamaño Subtítulo"
                                                placeholder="18px"></v-text-field>
                                        </v-col>
                                        <v-col cols="12" md="4">
                                            <v-select v-model="settings.fontsText.font" :items="fontOptions"
                                                label="Fuente Texto"></v-select>
                                            <v-text-field v-model="settings.fontsText.size" label="Tamaño Texto"
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
                                                        <v-text-field :model-value="currentDolarRate.rate"
                                                            label="Tasa Actual (Bs)" readonly
                                                            :loading="loadingDolarRate"></v-text-field>
                                                    </v-col>
                                                    <v-col cols="12" md="4">
                                                        <v-text-field :model-value="currentDolarRate.date"
                                                            label="Fecha de Actualización" readonly></v-text-field>
                                                    </v-col>
                                                    <v-col cols="12" md="4">
                                                        <v-btn color="secondary" @click="fetchDolarRate"
                                                            :loading="updatingDolarRate">
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
                                                        <v-text-field v-model="manualRate" label="Nueva Tasa (Bs)"
                                                            type="number" step="0.01"></v-text-field>
                                                    </v-col>
                                                    <v-col cols="12" md="4">
                                                        <v-text-field v-model="manualDate" label="Fecha (opcional)"
                                                            type="date"></v-text-field>
                                                    </v-col>
                                                    <v-col cols="12" md="4">
                                                        <v-btn color="primary" @click="updateManualRate"
                                                            :loading="updatingManualRate">
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
                                                <v-data-table :headers="dolarHeaders" :items="dolarHistory"
                                                    :loading="loadingHistory" item-key="id" class="elevation-1">
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
                                        <v-col cols="12" md="6">
                                            <v-text-field v-model="settings.business_opening_time"
                                                label="Hora de Apertura del Negocio"
                                                hint="Formato HH:mm (ej: 09:00)"></v-text-field>
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
import { ref, onMounted, watch, computed } from 'vue'
import { useAppStore } from '../../stores/app'
import { useCurrencyStore } from '../../stores/currencyStore'
import { useSettingsStore } from '../../stores/settingsStore'
import { useAuthStore } from '../../stores/auth'

export default {
  name: 'Settings',
  setup() {
    const tab = ref(0)
    const appStore = useAppStore()
    const currencyStore = useCurrencyStore()
    const settingsStore = useSettingsStore()
    const authStore = useAuthStore()
    const saving = ref(false)
    const isUpdatingRate = ref(false)

    // Dolar rate variables
    const currentDolarRate = ref({ rate: null, date: null })
    const loadingDolarRate = ref(false)
    const updatingDolarRate = ref(false)
    const updatingManualRate = ref(false)
    const manualRate = ref('')
    const manualDate = ref('')
    const dolarHistory = ref([])
    const loadingHistory = ref(false)

    const exchangeRate = computed(() => currencyStore.exchangeRate)

    // Create a local ref for settings to avoid direct mutation of the store.
    const settings = ref({})

    // Watch for the store to be populated and then create a local copy
    watch(() => settingsStore.settings, (newSettings) => {
      if (newSettings) {
        settings.value = JSON.parse(JSON.stringify(newSettings))
        // Ensure font objects exist
        if (!settings.value.fontsTitle) settings.value.fontsTitle = { font: 'Arial', size: '24px' }
        if (!settings.value.fontsSubtitle) settings.value.fontsSubtitle = { font: 'Arial', size: '18px' }
        if (!settings.value.fontsText) settings.value.fontsText = { font: 'Arial', size: '14px' }
      }
    }, { immediate: true, deep: true })

    // Watch for changes in local settings and update store immediately for darkMode
    watch(() => settings.value.darkMode, (newDarkMode) => {
      if (settingsStore.settings.darkMode !== newDarkMode) {
        settingsStore.settings.darkMode = newDarkMode
      }
    }, { immediate: false })

    // Define available tabs based on role
    const availableTabs = computed(() => {
      const userRole = authStore.user?.role
      const allTabs = [
        { name: 'General', index: 0 },
        { name: 'Interfaz', index: 1 },
        { name: 'Empresa', index: 2 },
        { name: 'Facturación', index: 3 },
        { name: 'Dólar', index: 4 },
        { name: 'Sistema', index: 5 }
      ]

      if (userRole === 'dev') {
        return allTabs
      } else if (userRole === 'administrador') {
        return allTabs.filter(tab => tab.name === 'Dólar')
      } else {
        // For other roles, no tabs (but they shouldn't reach here due to routing)
        return []
      }
    })

    // Adjust tab index if needed when tabs are filtered
    watch(() => availableTabs.value, (newTabs) => {
      if (newTabs.length > 0 && tab.value >= newTabs.length) {
        tab.value = 0
      }
    }, { immediate: true })

    // Map the current tab index to the actual window item index
    const currentWindowIndex = computed(() => {
      if (availableTabs.value.length === 0) return 0
      return availableTabs.value[tab.value]?.index || 0
    })

    const saveSettings = async () => {
      saving.value = true
      try {
        // Update the store with local changes before saving
        settingsStore.settings = { ...settingsStore.settings, ...settings.value }
        await settingsStore.saveSettings()
        // Force reload of settings store to apply changes
        await settingsStore.fetchSettings()
        // Optionally show a success message
      } catch (error) {
        console.error('Error saving settings:', error)
      } finally {
        saving.value = false
      }
    }

    const onLogoChange = (event) => {
      const file = event.target.files[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
          settings.value.systemLogo = e.target.result
        }
        reader.readAsDataURL(file)
      }
    }

    const fontOptions = [
      'Arial',
      'Helvetica',
      'Times New Roman',
      'Georgia',
      'Verdana',
      'Courier New',
      'Trebuchet MS',
      'Comic Sans MS',
      'Impact',
      'Lucida Sans',
      'Tahoma',
      'Palatino',
      'Garamond',
      'Bookman',
      'Avant Garde',
      'Arial Black',
      'Arial Narrow',
      'Century Gothic',
      'Franklin Gothic',
      'Gill Sans',
      'Lucida Grande',
      'Myriad',
      'Optima',
      'Segoe UI',
      'Candara',
      'Calibri',
      'Cambria',
      'Consolas',
      'Constantia',
      'Corbel',
      'Futura',
      'Geneva',
      'Lucida Console',
      'Monaco',
      'Papyrus',
      'Rockwell',
      'Symbol',
      'Webdings',
      'Wingdings'
    ]

    const createBackup = async () => {
      try {
        await window.electronAPI.invoke('create-backup')
      } catch (error) {
        console.error('Error creating backup:', error)
      }
    }

    const updateExchangeRate = async () => {
      isUpdatingRate.value = true
      try {
        await currencyStore.updateExchangeRate()
      } catch (error) {
        console.error('Error updating exchange rate:', error)
      } finally {
        isUpdatingRate.value = false
      }
    }

    // Dolar rate functions
    const fetchCurrentDolarRate = async () => {
      loadingDolarRate.value = true
      try {
        const result = await window.electronAPI.invoke('get-current-dolar-rate')
        if (result.success && result.data) {
          const data = result.data.dataValues || result.data
          currentDolarRate.value = {
            rate: data.rate,
            date: formatDate(data.date)
          }
        } else {
          currentDolarRate.value = { rate: null, date: null }
        }
      } catch (error) {
        console.error('Error fetching current dolar rate:', error)
        currentDolarRate.value = { rate: null, date: null }
      } finally {
        loadingDolarRate.value = false
      }
    }

    const fetchDolarHistory = async () => {
      loadingHistory.value = true
      try {
        const result = await window.electronAPI.invoke('get-dolar-history', 30)
        if (result.success) {
          dolarHistory.value = result.data
        } else {
          dolarHistory.value = []
        }
      } catch (error) {
        console.error('Error fetching dolar history:', error)
        dolarHistory.value = []
      } finally {
        loadingHistory.value = false
      }
    }

    const fetchDolarRate = async () => {
      updatingDolarRate.value = true
      try {
        const result = await window.electronAPI.invoke('fetch-dolar-rate')
        if (result.success) {
          await fetchCurrentDolarRate()
          await fetchDolarHistory()
          // Show success message
        } else {
          console.error('Error fetching dolar rate:', result.error)
        }
      } catch (error) {
        console.error('Error fetching dolar rate:', error)
      } finally {
        updatingDolarRate.value = false
      }
    }

    const updateManualRate = async () => {
      if (!manualRate.value) return

      updatingManualRate.value = true
      try {
        const result = await window.electronAPI.invoke('update-dolar-rate', manualRate.value, manualDate.value || null)
        if (result.success) {
          await fetchCurrentDolarRate()
          await fetchDolarHistory()
          manualRate.value = ''
          manualDate.value = ''
          // Show success message
        } else {
          console.error('Error updating manual rate:', result.error)
        }
      } catch (error) {
        console.error('Error updating manual rate:', error)
      } finally {
        updatingManualRate.value = false
      }
    }

    const formatCurrency = (amount) => {
      return new Intl.NumberFormat('es-VE', {
        style: 'currency',
        currency: 'VES'
      }).format(amount)
    }

    const formatDate = (dateString) => {
      if (!dateString) return ''
      const date = new Date(dateString)
      return date.toLocaleDateString('es-VE')
    }

    const formatDateTime = (dateString) => {
      if (!dateString) return ''
      const date = new Date(dateString)
      return date.toLocaleString('es-VE')
    }

    const dolarHeaders = [
      { title: 'Tasa (Bs)', key: 'rate', align: 'right' },
      { title: 'Fecha', key: 'date', align: 'center' },
      { title: 'Última Actualización', key: 'updatedAt', align: 'center' },
      { title: 'Fuente', key: 'source', align: 'center' }
    ]

    onMounted(async () => {
      await settingsStore.fetchSettings()
      currencyStore.fetchExchangeRate()
      await fetchCurrentDolarRate()
      await fetchDolarHistory()
    })

    return {
      tab,
      settings,
      saving,
      saveSettings,
      createBackup,
      onLogoChange,
      exchangeRate,
      isUpdatingRate,
      updateExchangeRate,
      fontOptions,
      // Dolar rate
      currentDolarRate,
      loadingDolarRate,
      updatingDolarRate,
      updatingManualRate,
      manualRate,
      manualDate,
      dolarHistory,
      loadingHistory,
      fetchDolarRate,
      updateManualRate,
      formatCurrency,
      formatDate,
      formatDateTime,
      dolarHeaders,
      availableTabs,
      currentWindowIndex,
    }
  },
}
</script>
<style scoped>
.v-btn {
    margin-top: 10px;
}
</style>
