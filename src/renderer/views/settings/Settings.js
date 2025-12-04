import { ref, onMounted, watch, computed } from 'vue'
import { useAppStore } from '../../stores/app'
import { useSettingsStore } from '../../stores/settingsStore'
import { useAuthStore } from '../../stores/auth'

export default {
  name: 'Settings',
  setup() {
    const tab = ref(0)
    const appStore = useAppStore()
    const settingsStore = useSettingsStore()
    const authStore = useAuthStore()
    const saving = ref(false)
    const currentDolarRate = ref({ rate: null, date: null })
    const loadingDolarRate = ref(false)
    const updatingDolarRate = ref(false)
    const updatingManualRate = ref(false)
    const manualRate = ref('')
    const manualDate = ref('')
    const dolarHistory = ref([])
    const loadingHistory = ref(false)

    const settings = ref({ ...settingsStore.settings })

    watch(() => settingsStore.settings, (newSettings) => {
      if (newSettings) {
        settings.value = { ...settings.value, ...newSettings }
        if (!settings.value.fonts_title) settings.value.fonts_title = { font: 'Arial', size: '24px' }
        if (!settings.value.fonts_subtitle) settings.value.fonts_subtitle = { font: 'Arial', size: '18px' }
        if (!settings.value.fonts_text) settings.value.fonts_text = { font: 'Arial', size: '14px' }
      }
    }, { immediate: true, deep: true })

    const availableTabs = computed(() => {
      const userRole = authStore.user?.role
      const allTabs = [
        { name: 'Interfaz', index: 0 },
        { name: 'Empresa', index: 1 },
        { name: 'Dólar', index: 2 }
      ]

      if (userRole === 'dev') {
        return allTabs
      } else if (userRole === 'administrador') {
        return allTabs.filter(tab => tab.name === 'Dólar')
      } else {
        return []
      }
    })

    watch(() => availableTabs.value, (newTabs) => {
      if (newTabs.length > 0 && tab.value >= newTabs.length) {
        tab.value = 0
      }
    }, { immediate: true })

    const currentWindowIndex = computed(() => {
      if (availableTabs.value.length === 0) return 0
      return availableTabs.value[tab.value]?.index || 0
    })

    const saveSettings = async () => {
      saving.value = true
      try {
        settingsStore.settings = { ...settingsStore.settings, ...settings.value }
        await settingsStore.saveSettings()
        await settingsStore.fetchSettings()
        alert('Configuración guardada exitosamente')
      } catch (error) {
        console.error('Error saving settings:', error)
        alert('Error al guardar configuración: ' + error.message)
      } finally {
        saving.value = false
      }
    }

    const onLogoChange = (event) => {
      const file = event.target.files[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
          settings.value.system_logo = e.target.result
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
      await fetchCurrentDolarRate()
      await fetchDolarHistory()
    })

    watch(() => tab.value, async (newTab) => {
      if (newTab === 0) { 
        await settingsStore.fetchSettings()
      } else if (newTab === 1) { 
        await settingsStore.fetchCompanySettings()
      }
    }, { immediate: true })

    return {
      tab,
      settings,
      saving,
      saveSettings,
      onLogoChange,
      fontOptions,
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
