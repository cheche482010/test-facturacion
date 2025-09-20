<template>
  <BaseDialog :model-value="modelValue" @update:modelValue="$emit('update:modelValue', $event)">
    <template #title>{{ product ? 'Ajustar Stock' : 'Ajuste Masivo de Stock' }}</template>

    <form @submit.prevent="saveAdjustment" class="space-y-4">
      <!-- Single Product Adjustment -->
      <div v-if="product">
        <div class="p-4 border rounded-lg dark:border-slate-700 mb-4">
            <p>{{ product.name }}</p>
            <p class="text-sm text-gray-500">{{ product.internalCode }}</p>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label class="form-label">Stock Actual</label>
                <input type="number" :value="product.currentStock" class="form-input bg-gray-100 dark:bg-slate-700" readonly />
            </div>
            <div>
                <label class="form-label">Nuevo Stock *</label>
                <input type="number" v-model.number="formData.newStock" class="form-input" required />
            </div>
            <div class="md:col-span-2">
                <label class="form-label">Motivo del Ajuste *</label>
                <select v-model="formData.reason" class="form-input" required>
                    <option v-for="opt in reasonOptions" :key="opt.value" :value="opt.value">{{ opt.title }}</option>
                </select>
            </div>
            <div class="md:col-span-2">
                <label class="form-label">Notas</label>
                <textarea v-model="formData.notes" rows="2" class="form-input"></textarea>
            </div>
        </div>
      </div>

      <!-- Mass Adjustment (placeholder) -->
      <div v-else>
          <p class="text-center text-gray-500">El formulario de ajuste masivo será implementado aquí.</p>
      </div>
    </form>

    <template #actions>
      <button @click="$emit('update:modelValue', false)" class="button-secondary">Cancelar</button>
      <button @click="saveAdjustment" class="button-primary" :disabled="saving">{{ saving ? 'Aplicando...' : 'Aplicar Ajuste' }}</button>
    </template>
  </BaseDialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import BaseDialog from '../ui/BaseDialog.vue';
import { useInventoryStore } from '../../stores/inventory';

const props = defineProps({
  modelValue: Boolean,
  product: Object
});
const emit = defineEmits(['update:modelValue', 'saved']);

const inventoryStore = useInventoryStore();
const saving = ref(false);

const reasonOptions = [
  { title: 'Inventario físico', value: 'inventario_fisico' },
  { title: 'Ajuste por diferencia', value: 'ajuste_diferencia' },
  { title: 'Producto dañado', value: 'producto_danado' },
  { title: 'Otro', value: 'otro' }
];

const initialFormState = () => ({
  newStock: 0,
  reason: '',
  notes: '',
});

const formData = ref(initialFormState());

watch(() => props.product, (newProduct) => {
  if (newProduct) {
    formData.value.newStock = newProduct.currentStock;
  }
}, { immediate: true });

const saveAdjustment = async () => {
  if (!formData.value.reason) {
    alert('Por favor, seleccione un motivo.');
    return;
  }
  saving.value = true;
  try {
    if (props.product) {
      await inventoryStore.adjustStock(
        props.product.id,
        formData.value.newStock,
        formData.value.reason,
        formData.value.notes
      );
    }
    emit('saved');
    emit('update:modelValue', false);
  } catch (error) {
    console.error('Error saving adjustment:', error);
  } finally {
    saving.value = false;
  }
};
</script>

<style scoped>
/* Using global styles from other components for form-input, button-primary, etc. */
.form-label {
    @apply block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1;
}
.form-input {
  @apply w-full px-3 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm;
}
.button-primary {
    @apply px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400;
}
.button-secondary {
    @apply px-4 py-2 rounded-lg bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600;
}
</style>
