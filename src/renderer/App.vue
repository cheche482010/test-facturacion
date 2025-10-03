<template>
  <router-view />
</template>

<script setup>
import { watch, onMounted } from 'vue'
import { useTheme } from 'vuetify'
import { useAppStore } from '@/stores/app'

const theme = useTheme()
const appStore = useAppStore()

const updateTheme = () => {
  theme.global.name.value = appStore.settings.darkMode ? 'dark' : 'light'
}

// Watch for changes in the darkMode setting
watch(
  () => appStore.settings.darkMode,
  (isDark) => {
    theme.global.name.value = isDark ? 'dark' : 'light'
  }
)

// Initial theme setup on component mount
onMounted(async () => {
  await appStore.loadSettings()
  updateTheme()
})
</script>