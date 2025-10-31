import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'
import { useSettingsStore } from '@/stores/settingsStore'

export default {
  setup() {
    const drawer = ref(true)
    const router = useRouter()
    const authStore = useAuthStore()
    const appStore = useAppStore()
    const settingsStore = useSettingsStore()

    const menuItems = computed(() => {
      const allItems = [
        { title: 'Dashboard', icon: 'mdi-view-dashboard', to: '/dashboard', permission: 'dashboard' },
        { title: 'Ventas', icon: 'mdi-point-of-sale', to: '/sales/new', permission: 'sales' },
        { title: 'Productos', icon: 'mdi-package-variant-closed', to: '/products', permission: 'products' },
        { title: 'Inventario', icon: 'mdi-warehouse', to: '/inventory', permission: 'inventory' },
        { title: 'Arqueo de caja', icon: 'mdi-cash-register', to: '/cash-reconciliation', permission: 'cash_reconciliation' },
        { title: 'Reportes', icon: 'mdi-chart-bar', to: '/reports', permission: 'reports' },
        { title: 'Configuración', icon: 'mdi-cog', to: '/settings', permission: 'settings' },
        { title: 'Usuarios', icon: 'mdi-account-group', to: '/users', permission: 'users' }
      ]

      // Filtrar items basados en permisos del usuario
      return allItems.filter(item => {
        if (!item.permission) return true
        if (item.permission === 'users') {
          return authStore.hasRole('dev')
        }
        return authStore.hasPermission(item.permission)
      })
    })

    const logout = () => {
      authStore.logout()
      router.push('/login')
    }

    return {
      drawer,
      menuItems,
      logout,
      settingsStore
    }
  }
}