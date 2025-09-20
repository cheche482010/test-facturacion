<template>
  <BaseDialog :model-value="modelValue" @update:modelValue="$emit('update:modelValue', $event)">
    <template #title>{{ isEditing ? 'Editar Producto' : 'Nuevo Producto' }}</template>

    <form @submit.prevent="saveProduct" class="space-y-6">
      <!-- Basic Info -->
      <div class="p-4 border rounded-lg dark:border-slate-700">
        <h3 class="text-lg font-medium mb-4">Información Básica</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="form-label">Código Interno *</label>
            <input type="text" v-model="formData.internalCode" class="form-input" required />
          </div>
          <div>
            <label class="form-label">Código de Barras</label>
            <input type="text" v-model="formData.barcode" class="form-input" />
          </div>
          <div class="md:col-span-2">
            <label class="form-label">Nombre del Producto *</label>
            <input type="text" v-model="formData.name" class="form-input" required />
          </div>
          <div class="md:col-span-2">
            <label class="form-label">Descripción</label>
            <textarea v-model="formData.description" rows="2" class="form-input"></textarea>
          </div>
          <div>
            <label class="form-label">Categoría</label>
            <select v-model="formData.categoryId" class="form-input">
              <option :value="null">Sin categoría</option>
              <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
            </select>
          </div>
           <div>
            <label class="form-label">Marca</label>
            <input type="text" v-model="formData.brand" class="form-input" />
          </div>
        </div>
      </div>

      <!-- Pricing -->
       <div class="p-4 border rounded-lg dark:border-slate-700">
        <h3 class="text-lg font-medium mb-4">Precios y Costos</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
           <div>
            <label class="form-label">Costo de Compra *</label>
            <input type="number" step="0.01" v-model.number="formData.costPrice" class="form-input" required />
          </div>
          <div>
            <label class="form-label">% Ganancia</label>
            <input type="number" step="0.01" v-model.number="formData.profitPercentage" class="form-input" />
          </div>
           <div>
            <label class="form-label">Precio Detal</label>
            <input type="number" step="0.01" v-model.number="formData.retailPrice" class="form-input" />
          </div>
        </div>
      </div>

      <!-- Inventory -->
      <div class="p-4 border rounded-lg dark:border-slate-700">
        <h3 class="text-lg font-medium mb-4">Inventario</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="form-label">Stock Actual</label>
            <input type="number" v-model.number="formData.currentStock" class="form-input" :readonly="isEditing" />
          </div>
          <div>
            <label class="form-label">Stock Mínimo</label>
            <input type="number" v-model.number="formData.minStock" class="form-input" />
          </div>
          <div>
            <label class="form-label">Stock Máximo</label>
            <input type="number" v-model.number="formData.maxStock" class="form-input" />
          </div>
        </div>
      </div>
    </form>

    <template #actions>
      <button @click="$emit('update:modelValue', false)" class="button-secondary">Cancelar</button>
      <button @click="saveProduct" class="button-primary" :disabled="saving">{{ saving ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Crear') }}</button>
    </template>
  </BaseDialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import BaseDialog from '../ui/BaseDialog.vue';
import { useProductStore } from '../../stores/products';

const props = defineProps({
  modelValue: Boolean,
  product: Object,
  categories: Array
});

const emit = defineEmits(['update:modelValue', 'saved']);

const productStore = useProductStore();
const saving = ref(false);

const initialFormState = () => ({
  internalCode: '',
  barcode: '',
  name: '',
  description: '',
  brand: '',
  categoryId: null,
  costPrice: 0,
  profitPercentage: 30,
  retailPrice: 0,
  currentStock: 0,
  minStock: 5,
  maxStock: 100,
  status: 'activo',
});

const formData = ref(initialFormState());

const isEditing = computed(() => !!props.product);

watch(() => props.product, (newProduct) => {
  if (newProduct) {
    formData.value = { ...initialFormState(), ...newProduct };
  } else {
    formData.value = initialFormState();
  }
}, { immediate: true, deep: true });

const saveProduct = async () => {
  if (!formData.value.name || !formData.value.internalCode) {
    // simple validation
    alert('Por favor, complete los campos requeridos.');
    return;
  }

  saving.value = true;
  try {
    if (isEditing.value) {
      await productStore.updateProduct(props.product.id, formData.value);
    } else {
      await productStore.createProduct(formData.value);
    }
    emit('saved');
    emit('update:modelValue', false);
  } catch (error) {
    console.error('Error saving product:', error);
  } finally {
    saving.value = false;
  }
};
</script>

<style scoped>
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
