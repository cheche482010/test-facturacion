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

  theme.change(settings.dark_mode ? "dark" : "light")

  if (settings.primary_color) {
    theme.themes.value.light.colors.primary = settings.primary_color
    theme.themes.value.dark.colors.primary = settings.primary_color
  }
  if (settings.secondary_color) {
    theme.themes.value.light.colors.secondary = settings.secondary_color
    theme.themes.value.dark.colors.secondary = settings.secondary_color
  }

  if (settings.fonts_title) {
    document.documentElement.style.setProperty('--font-title', settings.fonts_title.font)
    document.documentElement.style.setProperty('--font-size-title', settings.fonts_title.size)
  }
  if (settings.fonts_subtitle) {
    document.documentElement.style.setProperty('--font-subtitle', settings.fonts_subtitle.font)
    document.documentElement.style.setProperty('--font-size-subtitle', settings.fonts_subtitle.size)
  }
  if (settings.fonts_text) {
    document.documentElement.style.setProperty('--font-text', settings.fonts_text.font)
    document.documentElement.style.setProperty('--font-size-text', settings.fonts_text.size)
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
