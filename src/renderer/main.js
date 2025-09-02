import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHashHistory } from 'vue-router'
import Vuetify from 'vuetify'
import { aliases, mdi } from 'vuetify/iconsets/mdi'
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'

// Importar componentes y vistas
import App from './App.vue'
import Login from './views/Login.vue'
import Dashboard from './views/Dashboard.vue'
import Products from './views/Products.vue'
import Sales from './views/Sales.vue'
import Customers from './views/Customers.vue'
import Inventory from './views/Inventory.vue'
import Reports from './views/Reports.vue'
import Settings from './views/Settings.vue'

// Importar stores
import { useAuthStore } from './stores/auth'
import { useConfigStore } from './stores/config'

// Importar estilos
import './assets/styles/main.scss'

// Configuración de Vuetify
const vuetify = new Vuetify({
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: {
      mdi
    }
  },
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        colors: {
          primary: '#1976D2',
          secondary: '#424242',
          accent: '#82B1FF',
          error: '#FF5252',
          info: '#2196F3',
          success: '#4CAF50',
          warning: '#FFC107'
        }
      }
    }
  }
})

// Configuración de rutas
const routes = [
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { requiresAuth: false }
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: Dashboard,
    meta: { requiresAuth: true }
  },
  {
    path: '/products',
    name: 'Products',
    component: Products,
    meta: { requiresAuth: true }
  },
  {
    path: '/sales',
    name: 'Sales',
    component: Sales,
    meta: { requiresAuth: true }
  },
  {
    path: '/customers',
    name: 'Customers',
    component: Customers,
    meta: { requiresAuth: true }
  },
  {
    path: '/inventory',
    name: 'Inventory',
    component: Inventory,
    meta: { requiresAuth: true }
  },
  {
    path: '/reports',
    name: 'Reports',
    component: Reports,
    meta: { requiresAuth: true }
  },
  {
    path: '/settings',
    name: 'Settings',
    component: Settings,
    meta: { requiresAuth: true }
  }
]

// Crear router
const router = createRouter({
  history: createWebHashHistory(),
  routes
})

// Guardia de navegación
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  const configStore = useConfigStore()
  
  // Verificar si la ruta requiere autenticación
  if (to.meta.requiresAuth !== false) {
    // Verificar si hay token
    if (!authStore.token) {
      next('/login')
      return
    }
    
    // Verificar si el usuario está cargado
    if (!authStore.user) {
      try {
        await authStore.getUser()
      } catch (error) {
        authStore.logout()
        next('/login')
        return
      }
    }
    
    // Verificar permisos si es necesario
    if (to.meta.permission) {
      if (!authStore.hasPermission(to.meta.permission)) {
        next('/dashboard')
        return
      }
    }
  }
  
  // Cargar configuración si no está cargada
  if (!configStore.isLoaded) {
    try {
      await configStore.loadConfig()
    } catch (error) {
      console.warn('Error al cargar configuración:', error)
    }
  }
  
  next()
})

// Crear aplicación
const app = createApp(App)

// Usar plugins
app.use(createPinia())
app.use(router)
app.use(vuetify)

// Configuración global
app.config.globalProperties.$api = {
  baseURL: process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : '',
  timeout: 10000
}

// Montar aplicación
app.mount('#app')

// Manejar errores globales
app.config.errorHandler = (err, vm, info) => {
  console.error('Error global:', err, info)
}

// Manejar advertencias
app.config.warnHandler = (msg, vm, trace) => {
  console.warn('Advertencia:', msg, trace)
}

