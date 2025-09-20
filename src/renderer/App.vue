<template>
  <div :class="{ 'dark': isDark }" class="flex h-screen bg-gray-100 dark:bg-gray-900 font-sans">
    <!-- Sidebar -->
    <aside class="w-64 flex-shrink-0 bg-slate-800 text-white flex flex-col">
      <!-- Logo -->
      <div class="h-16 flex items-center justify-center border-b border-slate-700">
        <h1 class="text-2xl font-bold text-white">FacturaPro</h1>
        <span class="text-2xl font-thin text-slate-400">2</span>
      </div>

      <!-- Menu -->
      <nav class="flex-1 px-4 py-4">
        <h3 class="px-4 mb-2 text-xs font-semibold tracking-wider text-slate-400 uppercase">Módulos Principales</h3>
        <ul>
          <li v-for="item in menuItems" :key="item.title">
            <router-link
              :to="item.route"
              class="flex items-center px-4 py-2 rounded-md hover:bg-slate-700"
              active-class="bg-slate-900 text-white"
            >
              <component :is="item.icon" class="h-5 w-5 mr-3" />
              <span>{{ item.title }}</span>
            </router-link>
          </li>
        </ul>
      </nav>

      <!-- Sidebar Footer -->
      <div class="px-4 py-4 border-t border-slate-700">
        <!-- Dark Mode Toggle -->
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center">
            <svg class="h-5 w-5 mr-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path>
            </svg>
            <span class="text-sm">Modo Oscuro</span>
          </div>
          <label class="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" v-model="isDark" @change="toggleTheme" class="sr-only peer">
            <div class="w-11 h-6 bg-gray-600 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-800 dark:peer-focus:ring-blue-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
          </label>
        </div>

        <!-- User Info -->
        <div class="flex items-center">
          <div class="w-10 h-10 rounded-full bg-slate-600 flex items-center justify-center">
            <svg class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
            </svg>
          </div>
          <div class="ml-3">
            <p class="text-sm font-semibold">Usuario</p>
            <p class="text-xs text-slate-400">Administrador | v{{ appVersion }}</p>
          </div>
        </div>
      </div>
    </aside>

    <!-- Main content -->
    <main class="flex-1 overflow-y-auto p-8 bg-slate-50 dark:bg-slate-900">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { ref, markRaw, onMounted } from 'vue';
import { useTheme } from 'vuetify';
import { useAppStore } from './stores/app';

// Icons - using simple placeholders for now. In a real app, these would be proper components.
const DashboardIcon = { template: `<svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>` };
const ProductsIcon = { template: `<svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>` };
const SalesIcon = { template: `<svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>` };
const CustomersIcon = { template: `<svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>` };
const InventoryIcon = { template: `<svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"></path></svg>` };
const ReportsIcon = { template: `<svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>` };
const SettingsIcon = { template: `<svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.096 2.572-1.065z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>` };

const theme = useTheme();
const appStore = useAppStore();
const isDark = ref(false);
const appVersion = ref('1.0.0');

const menuItems = ref([
  { title: 'Dashboard', icon: markRaw(DashboardIcon), route: '/' },
  { title: 'Productos', icon: markRaw(ProductsIcon), route: '/products' },
  { title: 'Ventas', icon: markRaw(SalesIcon), route: '/sales/new' },
  { title: 'Clientes', icon: markRaw(CustomersIcon), route: '/customers' },
  { title: 'Inventario', icon: markRaw(InventoryIcon), route: '/inventory' },
  { title: 'Reportes', icon: markRaw(ReportsIcon), route: '/reports' },
  { title: 'Configuración', icon: markRaw(SettingsIcon), route: '/settings' },
]);

const toggleTheme = () => {
  theme.global.name.value = isDark.value ? 'dark' : 'light';
  if (isDark.value) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
};

onMounted(async () => {
  // Set initial theme based on Vuetify's theme
  isDark.value = theme.global.name.value === 'dark';
  if (isDark.value) {
    document.documentElement.classList.add('dark');
  }

  // Restore logic
  if (window.electronAPI) {
    appVersion.value = await window.electronAPI.getAppVersion();
    
    window.electronAPI.onMenuAction((event, action) => {
      console.log('Menu action:', action);
    });
  }
});
</script>

<style>
/* Custom scrollbar for webkit browsers */
.overflow-y-auto::-webkit-scrollbar {
  width: 8px;
}
.overflow-y-auto::-webkit-scrollbar-track {
  background-color: #f1f1f1;
  border-radius: 10px;
}
.overflow-y-auto::-webkit-scrollbar-thumb {
  background-color: #888;
  border-radius: 10px;
}
.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background-color: #555;
}

/* Dark mode scrollbar */
.dark .overflow-y-auto::-webkit-scrollbar-track {
  background-color: #2d3748;
}
.dark .overflow-y-auto::-webkit-scrollbar-thumb {
  background-color: #718096;
}
.dark .overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background-color: #a0aec0;
}

/* Ensure router-link-active has priority */
.router-link-exact-active, .router-link-active {
  background-color: #0f172a; /* slate-900 */
  color: white;
}
</style>
