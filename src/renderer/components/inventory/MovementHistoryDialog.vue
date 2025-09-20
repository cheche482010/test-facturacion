<template>
  <BaseDialog :model-value="modelValue" @update:modelValue="$emit('update:modelValue', $event)">
    <template #title>Historial de Movimientos</template>

    <div v-if="product" class="space-y-4">
      <!-- Product Info -->
      <div class="p-4 border rounded-lg dark:border-slate-700 flex justify-between items-center">
        <div>
            <p class="font-semibold">{{ product.name }}</p>
            <p class="text-sm text-gray-500">{{ product.internalCode }}</p>
        </div>
        <div class="text-right">
            <p class="text-lg font-bold">{{ product.currentStock }}</p>
            <p class="text-sm text-gray-500">Stock Actual</p>
        </div>
      </div>

      <!-- Filters -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <select v-model="selectedMovementType" class="form-input">
              <option :value="null">Todos los tipos</option>
              <option v-for="opt in movementTypeOptions" :key="opt.value" :value="opt.value">{{ opt.title }}</option>
          </select>
          <input type="date" v-model="startDate" class="form-input" />
          <input type="date" v-model="endDate" class="form-input" />
      </div>

      <!-- Movements List -->
      <div class="space-y-3 max-h-96 overflow-y-auto p-1">
        <div v-if="!filteredMovements.length" class="text-center text-gray-500 py-8">
            No se encontraron movimientos para los filtros seleccionados.
        </div>
        <div v-for="movement in filteredMovements" :key="movement.id" class="p-3 bg-gray-50 dark:bg-slate-900/50 rounded-lg border dark:border-slate-700">
            <div class="flex justify-between items-center">
                <div>
                    <p class="font-semibold">{{ getMovementTypeText(movement.movementType) }}</p>
                    <p class="text-xs text-gray-500">{{ getReasonText(movement.reason) }}</p>
                </div>
                <span class="px-2 py-1 text-xs font-bold rounded-full" :class="getMovementClass(movement.movementType)">
                    {{ movement.movementType === 'entrada' ? '+' : '' }}{{ movement.quantity }}
                </span>
            </div>
            <div class="text-xs text-gray-400 mt-2 flex justify-between">
                <span>{{ formatDate(movement.movementDate) }}</span>
                <span>Stock: {{ movement.previousStock }} → {{ movement.newStock }}</span>
            </div>
            <p v-if="movement.notes" class="text-xs text-gray-500 mt-1 pt-1 border-t dark:border-slate-600">Nota: {{ movement.notes }}</p>
        </div>
      </div>
    </div>

    <template #actions>
      <button @click="exportMovements" class="button-secondary">Exportar</button>
      <button @click="$emit('update:modelValue', false)" class="button-primary">Cerrar</button>
    </template>
  </BaseDialog>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import BaseDialog from '../ui/BaseDialog.vue';
import { useInventoryStore } from '../../stores/inventory';

const props = defineProps({
  modelValue: Boolean,
  product: Object
});

const emit = defineEmits(['update:modelValue']);

const inventoryStore = useInventoryStore();
const selectedMovementType = ref(null);
const startDate = ref('');
const endDate = ref('');

const movementTypeOptions = [
  { title: 'Entradas', value: 'entrada' },
  { title: 'Salidas', value: 'salida' },
  { title: 'Ajustes', value: 'ajuste' },
];

const movements = computed(() => {
  if (!props.product) return [];
  return inventoryStore.getMovementsByProduct(props.product.id);
});

const filteredMovements = computed(() => {
  let filtered = movements.value;
  if (selectedMovementType.value) {
    filtered = filtered.filter(m => m.movementType === selectedMovementType.value);
  }
  if (startDate.value) {
    filtered = filtered.filter(m => new Date(m.movementDate) >= new Date(startDate.value));
  }
  if (endDate.value) {
    filtered = filtered.filter(m => new Date(m.movementDate) <= new Date(endDate.value));
  }
  return filtered.sort((a, b) => new Date(b.movementDate) - new Date(a.movementDate));
});

const getMovementClass = (type) => ({
  'entrada': 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
  'salida': 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
  'ajuste': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
}[type] || 'bg-gray-100 dark:bg-gray-700');

const getMovementTypeText = (type) => ({
  'entrada': 'Entrada', 'salida': 'Salida', 'ajuste': 'Ajuste'
}[type] || type);

const getReasonText = (reason) => ({
  'compra': 'Compra', 'venta': 'Venta', 'ajuste_inventario': 'Ajuste', 'inventario_fisico': 'Inv. Físico'
}[reason] || reason);

const formatDate = (date) => new Date(date).toLocaleString('es-VE');

const exportMovements = () => { /* ... export logic ... */ };

watch(() => props.product, (newProduct) => {
  if (newProduct && props.modelValue) {
    inventoryStore.fetchMovementsByProduct(newProduct.id);
  }
});

onMounted(() => {
  const today = new Date();
  const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
  endDate.value = today.toISOString().split('T')[0];
  startDate.value = lastMonth.toISOString().split('T')[0];
});
</script>

<style scoped>
.form-input {
  @apply w-full px-3 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm;
}
.button-primary {
    @apply px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700;
}
.button-secondary {
    @apply px-4 py-2 rounded-lg bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600;
}
</style>
