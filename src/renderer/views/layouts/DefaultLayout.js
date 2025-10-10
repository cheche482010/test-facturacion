import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'

export default {
  setup() {
    const drawer = ref(true)
    const router = useRouter()
    const authStore = useAuthStore()
    const appStore = useAppStore()

    const menuItems = computed(() => {
      const allItems = [
        { title: 'Dashboard', icon: 'mdi-view-dashboard', to: '/dashboard', roles: ['dev', 'administrador'] },
        { title: 'Ventas', icon: 'mdi-point-of-sale', to: '/sales/new', roles: ['dev', 'administrador', 'cajero'] },
        { title: 'Productos', icon: 'mdi-package-variant-closed', to: '/products', roles: ['dev', 'administrador', 'cajero'] },
        { title: 'Inventario', icon: 'mdi-warehouse', to: '/inventory', roles: ['dev', 'administrador'] },
        { title: 'Reportes', icon: 'mdi-chart-bar', to: '/reports', roles: ['dev', 'administrador'] },
        { title: 'Arqueo de Caja', icon: 'mdi-cash-register', to: '/cash-reconciliation', roles: ['dev', 'administrador', 'cajero'] },
        { title: 'Configuración', icon: 'mdi-cog', to: '/settings', roles: ['dev'] }
      ]

      return allItems.filter(item => {
        if (!item.roles) return true
        return item.roles.includes(authStore.userRole)
      })
    })

    const logout = () => {
      authStore.logout()
      router.push('/login')
    }

    return {
      drawer,
      menuItems,
      logout
    }
  }
}