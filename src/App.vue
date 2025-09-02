<template>
  <v-app>
    <!-- Barra de navegación -->
    <v-app-bar app color="primary" dark>
      <v-app-bar-nav-icon @click="drawer = !drawer"></v-app-bar-nav-icon>
      
      <v-toolbar-title>Sistema de Facturación</v-toolbar-title>
      
      <v-spacer></v-spacer>
      
      <!-- Indicador de modo de operación -->
      <v-chip
        v-if="configStore.operationMode"
        :color="configStore.operationMode === 'tienda' ? 'success' : 'warning'"
        small
        class="mr-4"
      >
        {{ configStore.operationMode.toUpperCase() }}
      </v-chip>
      
      <!-- Menú de usuario -->
      <v-menu offset-y>
        <template v-slot:activator="{ props }">
          <v-btn icon v-bind="props">
            <v-icon>mdi-account-circle</v-icon>
          </v-btn>
        </template>
        
        <v-list>
          <v-list-item @click="showUserProfile">
            <v-list-item-title>
              <v-icon left>mdi-account</v-icon>
              Perfil
            </v-list-item-title>
          </v-list-item>
          
          <v-list-item @click="showSettings">
            <v-list-item-title>
              <v-icon left>mdi-cog</v-icon>
              Configuración
            </v-list-item-title>
          </v-list-item>
          
          <v-divider></v-divider>
          
          <v-list-item @click="logout">
            <v-list-item-title>
              <v-icon left>mdi-logout</v-icon>
              Cerrar Sesión
            </v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </v-app-bar>
    
    <!-- Menú lateral -->
    <v-navigation-drawer v-model="drawer" app>
      <v-list>
        <v-list-item
          v-for="item in menuItems"
          :key="item.title"
          :to="item.to"
          :prepend-icon="item.icon"
          :title="item.title"
          :disabled="!authStore.hasPermission(item.permission?.resource, item.permission?.action)"
        >
        </v-list-item>
      </v-list>
    </v-navigation-drawer>
    
    <!-- Contenido principal -->
    <v-main>
      <router-view></router-view>
    </v-main>
    
    <!-- Snackbar para notificaciones -->
    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      :timeout="snackbar.timeout"
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
    
    <!-- Diálogo de confirmación -->
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
    
    <!-- Overlay de carga -->
    <v-overlay
      v-model="loading"
      class="align-center justify-center"
    >
      <v-progress-circular
        indeterminate
        size="64"
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
    const drawer = ref(true)
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
    
    // Menú dinámico según modo de operación y permisos
    const menuItems = computed(() => {
      const items = [
        {
          title: 'Dashboard',
          icon: 'mdi-view-dashboard',
          to: '/dashboard',
          permission: { resource: 'reports', action: 'read' }
        },
        {
          title: 'Productos',
          icon: 'mdi-package-variant',
          to: '/products',
          permission: { resource: 'products', action: 'read' }
        },
        {
          title: 'Ventas',
          icon: 'mdi-cart',
          to: '/sales',
          permission: { resource: 'sales', action: 'read' }
        }
      ]
      
      // Agregar módulos solo en modo tienda
      if (configStore.operationMode === 'tienda') {
        items.push({
          title: 'Clientes',
          icon: 'mdi-account-group',
          to: '/customers',
          permission: { resource: 'customers', action: 'read' }
        })
      }
      
      items.push(
        {
          title: 'Inventario',
          icon: 'mdi-warehouse',
          to: '/inventory',
          permission: { resource: 'inventory', action: 'read' }
        },
        {
          title: 'Reportes',
          icon: 'mdi-chart-bar',
          to: '/reports',
          permission: { resource: 'reports', action: 'read' }
        },
        {
          title: 'Configuración',
          icon: 'mdi-cog',
          to: '/settings',
          permission: { resource: 'config', action: 'read' }
        }
      )
      
      return items
    })
    
    // Métodos
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
          onConfirm()
          confirmDialog.value.show = false
        }
      }
    }
    
    const setLoading = (value) => {
      loading.value = value
    }
    
    const logout = () => {
      showConfirm(
        'Cerrar Sesión',
        '¿Estás seguro de que quieres cerrar sesión?',
        () => {
          authStore.logout()
          router.push('/login')
        },
        'warning'
      )
    }
    
    const showUserProfile = () => {
      // Implementar vista de perfil de usuario
      showSnackbar('Funcionalidad en desarrollo', 'info')
    }
    
    const showSettings = () => {
      router.push('/settings')
    }
    
    // Exponer métodos globalmente
    const app = {
      showSnackbar,
      showConfirm,
      setLoading
    }
    
    // Hacer métodos disponibles globalmente
    window.$app = app
    
    // Cargar datos iniciales
    onMounted(async () => {
      try {
        setLoading(true)
        await configStore.loadConfig()
        
        // Verificar si hay token guardado
        if (authStore.token) {
          await authStore.getUser()
        }
      } catch (error) {
        console.error('Error al cargar datos iniciales:', error)
        showSnackbar('Error al cargar la configuración', 'error')
      } finally {
        setLoading(false)
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
      logout,
      showUserProfile,
      showSettings
    }
  }
}
</script>

<style scoped>
.v-navigation-drawer {
  border-right: 1px solid rgba(0, 0, 0, 0.12);
}

.v-list-item {
  margin: 4px 8px;
  border-radius: 8px;
}

.v-list-item:hover {
  background-color: rgba(0, 0, 0, 0.04);
}
</style>

