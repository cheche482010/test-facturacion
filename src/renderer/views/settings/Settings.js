import { ref, onMounted, computed, watch } from 'vue'
import { useAppStore } from '../../stores/app'

export default {
  name: 'Settings',
  setup() {
    const tab = ref(0)
    const appStore = useAppStore()
    const saving = ref(false)

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

    const createBackup = async () => {
      try {
        await window.electronAPI.invoke('create-backup')
      } catch (error) {
        console.error('Error creating backup:', error)
      }
    }

    onMounted(() => {
      appStore.loadSettings()
    })

    return {
      tab,
      settings,
      saving,
      operationModeOptions,
      saveSettings,
      createBackup,
    }
  },
}