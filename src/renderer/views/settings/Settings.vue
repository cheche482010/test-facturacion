<template>
  <div class="text-black dark:text-white">
    <!-- Header -->
    <div class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-3xl font-bold">Configuración del Sistema</h1>
        <p class="text-gray-500 dark:text-gray-400">Personaliza la apariencia y configuración del sistema</p>
      </div>
      <button @click="saveSettings" class="bg-gray-800 text-white dark:bg-gray-200 dark:text-black px-4 py-2 rounded-lg hover:bg-black dark:hover:bg-white flex items-center">
        <svg class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
        <span>Guardar Cambios</span>
      </button>
    </div>

    <div class="grid grid-cols-1 xl:grid-cols-2 gap-8">
      <!-- Left Column -->
      <div class="space-y-8">
        <!-- Company Info -->
        <div class="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
          <h2 class="text-xl font-semibold mb-4 flex items-center"><svg class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>Información de la Empresa</h2>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-1">Nombre del Sistema</label>
              <input type="text" v-model="settings.systemName" class="form-input" />
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">Nombre de la Empresa</label>
              <input type="text" v-model="settings.companyName" class="form-input" />
            </div>
            <div>
                <label class="block text-sm font-medium mb-1">Logo de la Empresa</label>
                <button class="border border-dashed border-gray-400 dark:border-slate-600 rounded-lg p-4 w-full text-center hover:bg-gray-50 dark:hover:bg-slate-700">
                    <svg class="h-8 w-8 mx-auto text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    <span>Cambiar Logo</span>
                </button>
            </div>
          </div>
        </div>

        <!-- Billing Config -->
        <div class="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
          <h2 class="text-xl font-semibold mb-4 flex items-center"><svg class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 8h6m-5 0a3 3 0 110 6H9l3 3m-3-6h6m6 1a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>Configuración de Facturación</h2>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-1">Símbolo de Moneda</label>
              <input type="text" v-model="settings.currencySymbol" class="form-input" />
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">Tasa de IVA por Defecto (%)</label>
              <input type="number" v-model="settings.defaultTaxRate" class="form-input" />
            </div>
             <div>
              <label class="block text-sm font-medium mb-1">Prefijo de facturas</label>
              <input type="text" v-model="settings.invoicePrefix" class="form-input" />
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">Modo de Venta por Defecto</label>
              <select v-model="settings.defaultSaleMode" class="form-input">
                <option value="pos">Modo Venta (Con clientes)</option>
                <option value="fast">Modo Rápido (Sin clientes)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Column -->
      <div class="space-y-8">
        <!-- Theme and Colors -->
        <div class="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
          <h2 class="text-xl font-semibold mb-4 flex items-center"><svg class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>Tema y Colores</h2>
          <div class="space-y-4">
            <div>
                <label class="block text-sm font-medium mb-2">Color Primario</label>
                <div class="flex space-x-2">
                    <button v-for="color in themeColors" :key="color.name" @click="settings.primaryColor = color.value" :class="[color.class, 'h-8 w-8 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-800', { 'ring-2 ring-offset-2 dark:ring-offset-slate-800 ring-black dark:ring-white': settings.primaryColor === color.value }]"></button>
                </div>
            </div>
            <!-- More color options here -->
             <div>
                <label class="block text-sm font-medium mb-1">Modo Oscuro por Defecto</label>
                <label class="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" v-model="settings.defaultDarkMode" class="sr-only peer">
                    <div class="w-11 h-6 bg-gray-200 dark:bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
            </div>
          </div>
        </div>

        <!-- Preview -->
        <div class="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
          <h2 class="text-xl font-semibold mb-4 flex items-center"><svg class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>Vista Previa del Sistema</h2>
          <div class="bg-slate-100 dark:bg-slate-700 p-4 rounded-lg">
            <div class="flex items-center mb-4">
                <div class="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold mr-3">F2</div>
                <div>
                    <p class="font-bold">{{ settings.systemName }}</p>
                    <p class="text-sm text-gray-500 dark:text-gray-400">{{ settings.companyName }}</p>
                </div>
            </div>
            <div class="flex space-x-2">
                <button class="bg-blue-500 text-white px-4 py-2 rounded-md text-sm">Botón Primario</button>
                <p class="text-sm text-gray-600 dark:text-gray-300 self-center">Moneda: {{ settings.currencySymbol }} | IVA: {{ settings.defaultTaxRate }}%</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAppStore } from '../../stores/app'

const appStore = useAppStore()

const loading = ref(false)
const settings = ref({
    systemName: 'FacturaPro2',
    companyName: 'Mi Empresa',
    currencySymbol: '$',
    defaultTaxRate: 16,
    invoicePrefix: 'FAC',
    defaultSaleMode: 'pos',
    primaryColor: '#3b82f6', // blue-500
    defaultDarkMode: false,
})

const themeColors = [
    { name: 'Azul', value: '#3b82f6', class: 'bg-blue-500' },
    { name: 'Verde', value: '#22c55e', class: 'bg-green-500' },
    { name: 'Púrpura', value: '#a855f7', class: 'bg-purple-500' },
    { name: 'Rosa', value: '#ec4899', class: 'bg-pink-500' },
    { name: 'Naranja', value: '#f97316', class: 'bg-orange-500' },
    { name: 'Rojo', value: '#ef4444', class: 'bg-red-500' },
]

const loadSettings = async () => {
    loading.value = true;
    try {
        const storedSettings = await appStore.fetchSettings();
        if (storedSettings) {
            settings.value = { ...settings.value, ...storedSettings };
        }
    } catch (error) {
        console.error('Error loading settings:', error);
    } finally {
        loading.value = false;
    }
}

const saveSettings = async () => {
    loading.value = true;
    try {
        await appStore.saveSettings(settings.value);
        // Maybe show a success notification
    } catch (error) {
        console.error('Error saving settings:', error);
    } finally {
        loading.value = false;
    }
}

onMounted(loadSettings);
</script>

<style scoped>
.form-input {
  @apply w-full px-3 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm;
}
</style>
