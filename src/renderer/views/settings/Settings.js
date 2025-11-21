import { ref, onMounted, watch, computed } from 'vue'
import { useAppStore } from '../../stores/app'
import { useCurrencyStore } from '../../stores/currencyStore'
import { useSettingsStore } from '../../stores/settingsStore'

export default {
  name: 'Settings',
  setup() {
    const tab = ref(0)
    const appStore = useAppStore()
    const currencyStore = useCurrencyStore()
    const settingsStore = useSettingsStore()
    const saving = ref(false)
    const isUpdatingRate = ref(false)

    const currentDolarRate = ref({ rate: null, date: null })
    const loadingDolarRate = ref(false)
    const updatingDolarRate = ref(false)
    const updatingManualRate = ref(false)
    const manualRate = ref('')
    const manualDate = ref('')
    const dolarHistory = ref([])
    const loadingHistory = ref(false)

    const exchangeRate = computed(() => currencyStore.exchangeRate)

    const settings = ref({})

    watch(() => settingsStore.settings, (newSettings) => {
      if (newSettings) {
        settings.value = JSON.parse(JSON.stringify(newSettings))
        if (!settings.value.fontsTitle) settings.value.fontsTitle = { font: 'Arial', size: '24px' }
        if (!settings.value.fontsSubtitle) settings.value.fontsSubtitle = { font: 'Arial', size: '18px' }
        if (!settings.value.fontsText) settings.value.fontsText = { font: 'Arial', size: '14px' }
      }
    }, { immediate: true, deep: true })

    watch(() => settings.value.darkMode, (newDarkMode) => {
      if (settingsStore.settings.darkMode !== newDarkMode) {
        settingsStore.settings.darkMode = newDarkMode
      }
    }, { immediate: false })

    const saveSettings = async () => {
      saving.value = true
      try {
        settingsStore.settings = { ...settingsStore.settings, ...settings.value }
        await settingsStore.saveSettings()
        await settingsStore.fetchSettings()
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
    }
  },
}
