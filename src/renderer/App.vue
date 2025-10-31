<template>
  <router-view />
</template>

<script setup>
import { watch, onMounted } from 'vue'
import { useTheme } from 'vuetify'
import { useAppStore } from '@/stores/app'
import { useSettingsStore } from '@/stores/settingsStore'

const theme = useTheme()
const appStore = useAppStore()
const settingsStore = useSettingsStore()

// Function to update the theme based on store settings
const updateTheme = () => {
  const settings = settingsStore.settings

  // Set dark/light mode
  theme.change(settings.darkMode ? "dark" : "light")

  // Update theme colors from settings
  if (settings.primaryColor) {
    theme.themes.value.light.colors.primary = settings.primaryColor
    theme.themes.value.dark.colors.primary = settings.primaryColor
  }
  if (settings.secondaryColor) {
    theme.themes.value.light.colors.secondary = settings.secondaryColor
    theme.themes.value.dark.colors.secondary = settings.secondaryColor
  }

  // Apply custom fonts
  if (settings.fontsTitle) {
    document.documentElement.style.setProperty('--font-title', settings.fontsTitle.font)
    document.documentElement.style.setProperty('--font-size-title', settings.fontsTitle.size)
  }
  if (settings.fontsSubtitle) {
    document.documentElement.style.setProperty('--font-subtitle', settings.fontsSubtitle.font)
    document.documentElement.style.setProperty('--font-size-subtitle', settings.fontsSubtitle.size)
  }
  if (settings.fontsText) {
    document.documentElement.style.setProperty('--font-text', settings.fontsText.font)
    document.documentElement.style.setProperty('--font-size-text', settings.fontsText.size)
  }
}

// Watch for any changes in the settings object to apply theme changes reactively
watch(
  () => settingsStore.settings,
  () => {
    updateTheme()
  },
  { deep: true }
)

// Initial theme setup on component mount
onMounted(async () => {
  // First, load any saved settings from persistent storage
  await settingsStore.fetchSettings()
  // Then, apply the theme
  updateTheme()
})
</script>
