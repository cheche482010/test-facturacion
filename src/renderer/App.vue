<template>
  <router-view />
</template>

<script setup>
import { watch, onMounted } from 'vue'
import { useTheme } from 'vuetify'
import { useAppStore } from '@/stores/app'

const theme = useTheme()
const appStore = useAppStore()

// Function to update the theme based on store settings
const updateTheme = () => {
  const settings = appStore.settings

  // Set dark/light mode
  theme.global.name.value = settings.darkMode ? "dark" : "light"

  // Update theme colors from settings
  if (settings.primaryColor) {
    theme.themes.value.light.colors.primary = settings.primaryColor
    theme.themes.value.dark.colors.primary = settings.primaryColor
  }
  if (settings.secondaryColor) {
    theme.themes.value.light.colors.secondary = settings.secondaryColor
    theme.themes.value.dark.colors.secondary = settings.secondaryColor
  }
  if (settings.accentColor) {
    theme.themes.value.light.colors.accent = settings.accentColor
    theme.themes.value.dark.colors.accent = settings.accentColor
  }
}

// Watch for any changes in the settings object to apply theme changes reactively
watch(
  () => appStore.settings,
  () => {
    updateTheme()
  },
  { deep: true }
)

// Initial theme setup on component mount
onMounted(async () => {
  // First, load any saved settings from persistent storage
  await appStore.loadSettings()
  // Then, apply the theme
  updateTheme()
})
</script>
