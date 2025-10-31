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

    onMounted(async () => {
      await settingsStore.fetchSettings()
      currencyStore.fetchExchangeRate()
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
    }
  },
}
