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
      const items = [
        { title: 'Dashboard', icon: 'mdi-view-dashboard', to: '/dashboard' },
        { title: 'Ventas', icon: 'mdi-point-of-sale', to: '/sales/new' },
        { title: 'Productos', icon: 'mdi-package-variant-closed', to: '/products' },
        { title: 'Inventario', icon: 'mdi-warehouse', to: '/inventory' },
        { title: 'Reportes', icon: 'mdi-chart-bar', to: '/reports' },
        { title: 'Arqueo de Caja', icon: 'mdi-cash-register', to: '/cash-reconciliation' },
        { title: 'Configuración', icon: 'mdi-cog', to: '/settings' }
      ]

      return items
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