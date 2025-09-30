import { ref, onMounted, computed } from "vue"
import { useSettingsStore } from "../../stores/settingsStore"

export default {
  name: "Settings",
  setup() {
    const tab = ref(0)
    const settingsStore = useSettingsStore()

    const settings = computed(() => settingsStore.settings)
    const saving = computed(() => settingsStore.loading)

    const themeOptions = [
      { text: "Claro", value: "light" },
      { text: "Oscuro", value: "dark" },
    ]

    const operationModeOptions = [
      { text: "Modo Bodega", value: "bodega" },
      { text: "Modo Tienda", value: "tienda" },
    ]

    const saveSettings = async () => {
      await settingsStore.saveSettings()
    }

    const createBackup = async () => {
      try {
        await window.electronAPI.invoke("create-backup")
      } catch (error) {
        console.error("Error creating backup:", error)
      }
    }

    onMounted(() => {
      settingsStore.fetchSettings()
    })

    return {
      tab,
      settings,
      saving,
      themeOptions,
      operationModeOptions,
      saveSettings,
      createBackup,
    }
  },
}