import { ref, onMounted, watch, computed } from 'vue'
import { useAppStore } from '../../stores/app'
import { useCurrencyStore } from '../../stores/currencyStore'

export default {
  name: 'Settings',
  setup() {
    const tab = ref(0)
    const appStore = useAppStore()
    const currencyStore = useCurrencyStore()
    const saving = ref(false)
    const isUpdatingRate = ref(false)

    const exchangeRate = computed(() => currencyStore.exchangeRate)

    // Create a local ref for settings to avoid direct mutation of the store.
    const settings = ref({})

    // Watch for the store to be populated and then create a local copy
    watch(() => appStore.settings, (newSettings) => {
      if (newSettings) {
        settings.value = JSON.parse(JSON.stringify(newSettings))
      }
    }, { immediate: true, deep: true })

    const operationModeOptions = [
      { text: 'Modo Bodega', value: 'bodega' },
      { text: 'Modo Tienda', value: 'tienda' },
    ]

    const saveSettings = async () => {
      saving.value = true
      try {
        await appStore.saveSettings(settings.value)
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
          settings.value.companyLogo = e.target.result
        }
        reader.readAsDataURL(file)
      }
    }

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

    onMounted(() => {
      appStore.loadSettings()
      currencyStore.fetchExchangeRate()
    })

    return {
      tab,
      settings,
      saving,
      operationModeOptions,
      saveSettings,
      createBackup,
      onLogoChange,
      exchangeRate,
      isUpdatingRate,
      updateExchangeRate,
    }
  },
}
