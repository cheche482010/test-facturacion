<template>
  <router-view />
</template>

<script setup>
import { watch, onMounted } from 'vue'
import { useTheme } from 'vuetify'
import { useAppStore } from '@/stores/app'
import { useSettingsStore } from '@/stores/settingsStore'
import { useSalesStore } from '@/stores/sales'

const theme = useTheme()
const appStore = useAppStore()
const settingsStore = useSettingsStore()

const updateTheme = () => {
  const settings = settingsStore.settings

  theme.change(settings.darkMode ? "dark" : "light")

  if (settings.primaryColor) {
    theme.themes.value.light.colors.primary = settings.primaryColor
    theme.themes.value.dark.colors.primary = settings.primaryColor
  }
  if (settings.secondaryColor) {
    theme.themes.value.light.colors.secondary = settings.secondaryColor
    theme.themes.value.dark.colors.secondary = settings.secondaryColor
  }

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

watch(
  () => settingsStore.settings,
  () => {
    updateTheme()
  },
  { deep: true }
)


onMounted(async () => {
  await settingsStore.fetchSettings()
  updateTheme()

  sessionStorage.setItem('reloading', 'true')

  const salesStore = useSalesStore()
  window.addEventListener('beforeunload', () => {
    if (sessionStorage.getItem('reloading') === 'true') {
      sessionStorage.removeItem('reloading')
    } else {
      salesStore.clearPendingCart()
    }
  })
})
</script>
