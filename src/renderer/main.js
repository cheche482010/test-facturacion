import { createApp } from "vue"
import { createPinia } from "pinia"
import { createVuetify } from "vuetify"
import * as components from "vuetify/components"
import * as directives from "vuetify/directives"
import "vuetify/styles"
import "./assets/styles/main.scss"

import App from "./App.vue"
import router from "./router"
import { useAuthStore } from "./stores/auth"

// Configuración de Vuetify
const vuetify = createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: "light",
    themes: {
      light: {
        colors: {
          primary: "#1976D2",
          secondary: "#424242",
          accent: "#82B1FF",
          error: "#FF5252",
          info: "#2196F3",
          success: "#4CAF50",
          warning: "#FFC107",
        },
      },
      dark: {
        colors: {
          primary: "#2196F3",
          secondary: "#424242",
          accent: "#FF4081",
          error: "#FF5252",
          info: "#2196F3",
          success: "#4CAF50",
          warning: "#FB8C00",
        },
      },
    },
  },
})

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(vuetify)

// Inicialización de la autenticación
async function initializeAuth() {
  const authStore = useAuthStore()
  if (authStore.token) {
    await authStore.checkAuth()
  }
  // Montar la aplicación solo después de que la autenticación inicial (si existe) se haya verificado.
  app.mount("#app")
}

// Esperar a que el router esté listo antes de inicializar la autenticación y montar la app.
router.isReady().then(() => {
  initializeAuth()
})
