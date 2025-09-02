<template>
  <v-app>
    <!-- Barra de navegación -->
    <v-app-bar
      v-if="authStore.isAuthenticated"
      app
      color="primary"
      dark
      elevation="1"
    >
      <v-app-bar-nav-icon @click="drawer = !drawer"></v-app-bar-nav-icon>
      
      <v-toolbar-title>
        <v-icon left>mdi-cart</v-icon>
        Sistema de Facturación
      </v-toolbar-title>
      
      <v-spacer></v-spacer>
      
      <!-- Indicador de modo de operación -->
      <v-chip
        :color="configStore.operationMode === 'tienda' ? 'success' : 'warning'"
        small
        class="mr-4"
      >
        <v-icon left small>
          {{ configStore.operationMode === 'tienda' ? 'mdi-store' : 'mdi-warehouse' }}
        </v-icon>
        {{ configStore.operationMode === 'tienda' ? 'Tienda' : 'Bodega' }}
      </v-chip>
      
      <!-- Menú de usuario -->
      <v-menu offset-y>
        <template v-slot:activator="{ props }">
          <v-btn
            icon
            v-bind="props"
          >
            <v-icon>mdi-account-circle</v-icon>
          </v-btn>
        </template>
        
        <v-list>
          <v-list-item @click="showUserProfile">
            <v-list-item-icon>
              <v-icon>mdi-account</v-icon>
            </v-list-item-icon>
            <v-list-item-title>{{ authStore.user?.full_name }}</v-list-item-title>
          </v-list-item>
          
          <v-divider></v-divider>
          
          <v-list-item @click="showSettings">
            <v-list-item-icon>
              <v-icon>mdi-cog</v-icon>
            </v-list-item-icon>
            <v-list-item-title>Configuración</v-list-item-title>
          </v-list-item>
          
          <v-list-item @click="logout">
            <v-list-item-icon>
              <v-icon>mdi-logout</v-icon>
            </v-list-item-icon>
            <v-list-item-title>Cerrar Sesión</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </v-app-bar>
    
    <!-- Menú lateral -->
    <v-navigation-drawer
      v-if="authStore.isAuthenticated"
      v-model="drawer"
      app
      temporary
    >
      <v-list>
        <v-list-item
          v-for="item in menuItems"
          :key="item.title"
          :to="item.to"
          :disabled="!authStore.hasPermission(item.permission)"
        >
          <v-list-item-icon>
            <v-icon>{{ item.icon }}</v-icon>
          </v-list-item-icon>
          
          <v-list-item-content>
            <v-list-item-title>{{ item.title }}</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>
    
    <!-- Contenido principal -->
    <v-main>
      <v-container fluid class="pa-0">
        <router-view></router-view>
      </v-container>
    </v-main>
    
    <!-- Snackbar para notificaciones -->
    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      :timeout="snackbar.timeout"
      top
    >
      {{ snackbar.text }}
      
      <template v-slot:actions>
        <v-btn
          color="white"
          text
          @click="snackbar.show = false"
        >
          Cerrar
        </v-btn>
      </template>
    </v-snackbar>
    
    <!-- Dialog de confirmación -->
    <v-dialog v-model="confirmDialog.show" max-width="400">
      <v-card>
        <v-card-title>{{ confirmDialog.title }}</v-card-title>
        <v-card-text>{{ confirmDialog.message }}</v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="grey"
            text
            @click="confirmDialog.show = false"
          >
            Cancelar
          </v-btn>
          <v-btn
            :color="confirmDialog.color || 'primary'"
            @click="confirmDialog.onConfirm"
          >
            Confirmar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    
    <!-- Loading overlay -->
    <v-overlay
      v-model="loading"
      absolute
      opacity="0.8"
    >
      <v-progress-circular
        indeterminate
        size="64"
        color="primary"
      ></v-progress-circular>
    </v-overlay>
  </v-app>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from './stores/auth'
import { useConfigStore } from './stores/config'

export default {
  name: 'App',
  
  setup() {
    const router = useRouter()
    const authStore = useAuthStore()
    const configStore = useConfigStore()
    
    // Estado reactivo
    const drawer = ref(false)
    const loading = ref(false)
    
    const snackbar = ref({
      show: false,
      text: '',
      color: 'success',
      timeout: 3000
    })
    
    const confirmDialog = ref({
      show: false,
      title: '',
      message: '',
      color: 'primary',
      onConfirm: null
    })
    
    // Menú de navegación
    const menuItems = computed(() => {
      const items = [
        {
          title: 'Dashboard',
          icon: 'mdi-view-dashboard',
          to: '/dashboard',
          permission: 'reports:read'
        },
        {
          title: 'Ventas',
          icon: 'mdi-cart',
          to: '/sales',
          permission: 'sales:read'
        },
        {
          title: 'Productos',
          icon: 'mdi-package-variant',
          to: '/products',
          permission: 'products:read'
        },
        {
          title: 'Inventario',
          icon: 'mdi-warehouse',
          to: '/inventory',
          permission: 'inventory:read'
        }
      ]
      
      // Agregar clientes solo en modo tienda
      if (configStore.operationMode === 'tienda') {
        items.push({
          title: 'Clientes',
          icon: 'mdi-account-group',
          to: '/customers',
          permission: 'customers:read'
        })
      }
      
      items.push({
        title: 'Reportes',
        icon: 'mdi-chart-bar',
        to: '/reports',
        permission: 'reports:read'
      })
      
      return items
    })
    
    // Métodos
    const showUserProfile = () => {
      // Implementar perfil de usuario
      console.log('Mostrar perfil de usuario')
    }
    
    const showSettings = () => {
      router.push('/settings')
    }
    
    const logout = async () => {
      try {
        await authStore.logout()
        router.push('/login')
      } catch (error) {
        console.error('Error al cerrar sesión:', error)
      }
    }
    
    // Exponer métodos globales
    const showSnackbar = (text, color = 'success', timeout = 3000) => {
      snackbar.value = {
        show: true,
        text,
        color,
        timeout
      }
    }
    
    const showConfirm = (title, message, onConfirm, color = 'primary') => {
      confirmDialog.value = {
        show: true,
        title,
        message,
        color,
        onConfirm: () => {
          confirmDialog.value.show = false
          onConfirm()
        }
      }
    }
    
    const setLoading = (value) => {
      loading.value = value
    }
    
    // Hacer métodos disponibles globalmente
    window.$app = {
      showSnackbar,
      showConfirm,
      setLoading
    }
    
    // Inicialización
    onMounted(async () => {
      try {
        // Cargar configuración inicial
        if (!configStore.isLoaded) {
          await configStore.loadConfig()
        }
        
        // Verificar autenticación
        if (authStore.token && !authStore.user) {
          await authStore.getUser()
        }
      } catch (error) {
        console.error('Error en inicialización:', error)
      }
    })
    
    return {
      drawer,
      loading,
      snackbar,
      confirmDialog,
      menuItems,
      authStore,
      configStore,
      showUserProfile,
      showSettings,
      logout
    }
  }
}
</script>

<style lang="scss">
// Estilos globales
.v-application {
  font-family: 'Roboto', sans-serif;
}

// Personalización de scrollbar
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
}

::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

// Animaciones
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease;
}

.slide-enter-from {
  transform: translateX(-100%);
}

.slide-leave-to {
  transform: translateX(100%);
}
</style>

