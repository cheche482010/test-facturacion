<template>
  <v-app>
    <v-navigation-drawer
      v-model="drawer"
      app
      clipped
      :width="280"
    >
      <v-list>
        <v-list-item
          v-for="item in menuItems"
          :key="item.title"
          :to="item.route"
          link
        >
          <template v-slot:prepend>
            <v-icon>{{ item.icon }}</v-icon>
          </template>
          <v-list-item-title>{{ item.title }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>

    <v-app-bar
      app
      clipped-left
      color="primary"
      dark
    >
      <v-app-bar-nav-icon @click="drawer = !drawer"></v-app-bar-nav-icon>
      <v-toolbar-title>Sistema de Facturación</v-toolbar-title>
      <v-spacer></v-spacer>
      
      <!-- Selector de modo -->
      <v-chip
        :color="currentMode === 'bodega' ? 'orange' : 'green'"
        text-color="white"
        class="mr-4"
      >
        <v-icon left>{{ currentMode === 'bodega' ? 'mdi-warehouse' : 'mdi-store' }}</v-icon>
        Modo {{ currentMode === 'bodega' ? 'Bodega' : 'Tienda' }}
      </v-chip>

      <v-btn icon @click="toggleTheme">
        <v-icon>{{ isDark ? 'mdi-brightness-7' : 'mdi-brightness-4' }}</v-icon>
      </v-btn>
    </v-app-bar>

    <v-main>
      <v-container fluid>
        <router-view />
      </v-container>
    </v-main>

    <v-footer app>
      <span>&copy; {{ new Date().getFullYear() }} Sistema de Facturación v{{ appVersion }}</span>
    </v-footer>
  </v-app>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useTheme } from 'vuetify';
import { useAppStore } from './stores/app';

const theme = useTheme();
const appStore = useAppStore();

const drawer = ref(true);
const isDark = ref(false);
const appVersion = ref('1.0.0');
const currentMode = ref('bodega'); // 'bodega' o 'tienda'

const menuItems = ref([
  { title: 'Dashboard', icon: 'mdi-view-dashboard', route: '/' },
  { title: 'Nueva Venta', icon: 'mdi-cash-register', route: '/sales/new' },
  { title: 'Productos', icon: 'mdi-package-variant', route: '/products' },
  { title: 'Inventario', icon: 'mdi-warehouse', route: '/inventory' },
  { title: 'Clientes', icon: 'mdi-account-group', route: '/customers' },
  { title: 'Reportes', icon: 'mdi-chart-line', route: '/reports' },
  { title: 'Configuración', icon: 'mdi-cog', route: '/settings' }
]);

const toggleTheme = () => {
  isDark.value = !isDark.value;
  theme.global.name.value = isDark.value ? 'dark' : 'light';
};

onMounted(async () => {
  // Obtener versión de la aplicación
  if (window.electronAPI) {
    appVersion.value = await window.electronAPI.getAppVersion();
    
    // Escuchar acciones del menú
    window.electronAPI.onMenuAction((event, action) => {
      // Manejar acciones del menú nativo
      console.log('Menu action:', action);
    });
  }
});
</script>

<style scoped>
.v-application {
  font-family: 'Roboto', sans-serif;
}
</style>
