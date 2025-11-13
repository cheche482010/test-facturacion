import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'
import { useSettingsStore } from '@/stores/settingsStore'
import { useSalesStore } from '@/stores/sales'

export default {
  setup() {
    const drawer = ref(true)
    const router = useRouter()
    const authStore = useAuthStore()
    const appStore = useAppStore()
    const settingsStore = useSettingsStore()
    const salesStore = useSalesStore()
    const currentDolarRate = ref(null)
    const loadingDolarRate = ref(false)

    const menuItems = computed(() => {
      const allItems = [
        { title: 'Dashboard', icon: 'mdi-view-dashboard', to: '/dashboard', permission: 'dashboard' },
        { title: 'Ventas', icon: 'mdi-point-of-sale', to: '/sales/new', permission: 'sales' },
        { title: 'Productos', icon: 'mdi-package-variant-closed', to: '/products', permission: 'products' },
        { title: 'Inventario', icon: 'mdi-warehouse', to: '/inventory', permission: 'inventory' },
        { title: 'Arqueo de caja', icon: 'mdi-cash-register', to: '/cash-reconciliation', permission: 'cash_reconciliation' },
        { title: 'Reportes', icon: 'mdi-chart-bar', to: '/reports', permission: 'reports' },
        { title: 'Calculadora', icon: 'mdi-calculator', to: '/calculator' },
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

    const fetchCurrentDolarRate = async () => {
      loadingDolarRate.value = true
      try {
        const result = await window.electronAPI.invoke('get-current-dolar-rate')
        if (result.success && result.data) {
          currentDolarRate.value = result.data
        }
      } catch (error) {
        console.error('Error fetching current dolar rate:', error)
      } finally {
        loadingDolarRate.value = false
      }
    }

    const formatCurrency = (amount) => {
      if (!amount) return '0.00'
      return new Intl.NumberFormat('es-VE', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(amount)
    }

    const formatDateTime = (dateString) => {
      if (!dateString) return ''
      const date = new Date(dateString)
      return date.toLocaleString('es-VE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }

    const logout = () => {
      authStore.logout()
      router.push('/login')
    }

    onMounted(() => {
      fetchCurrentDolarRate()
      setInterval(fetchCurrentDolarRate, 5 * 60 * 1000)
      salesStore.loadPendingCart()
    })

    router.afterEach(() => {
      salesStore.loadPendingCart()
    })

    return {
      drawer,
      menuItems,
      logout,
      settingsStore,
      currentDolarRate,
      formatCurrency,
      formatDateTime,
      hasPendingCart: salesStore.hasPendingCart,
      salesStore 
    }
  }
}