import { ref, onMounted, watch } from 'vue'
import { useAppStore } from '../../stores/app'

export default {
  setup() {
    const appStore = useAppStore()
    const saving = ref(false)

    // Use a local ref for settings to allow editing, and sync it with the store
    const settings = ref({})

    const colorSwatches = [
      ['#2196F3', '#4CAF50', '#E91E63', '#9C27B0'],
      ['#FF9800', '#F44336', '#795548', '#607D8B']
    ]

    const loadSettings = () => {
      // Create a deep copy to prevent direct mutation of the store's state
      settings.value = JSON.parse(JSON.stringify(appStore.settings))
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

    const saveSettings = async () => {
      saving.value = true
      try {
        await appStore.saveSettings(settings.value)
        // Optionally show a success message
      } catch (error) {
        console.error("Error saving settings:", error)
        // Optionally show an error message
      } finally {
        saving.value = false
      }
    }

    // Watch for changes in the store settings and update the local copy
    watch(() => appStore.settings, (newSettings) => {
      settings.value = JSON.parse(JSON.stringify(newSettings))
    }, { deep: true })

    // Initial load
    onMounted(() => {
      loadSettings()
    })

    return {
      settings,
      saving,
      colorSwatches,
      onLogoChange,
      saveSettings
    }
  }
}