<template>
  <BaseDialog :model-value="modelValue" @update:modelValue="$emit('update:modelValue', $event)">
    <template #title>Procesar Pago</template>

    <div class="space-y-4">
      <div class="p-4 border rounded-lg dark:border-slate-700 flex justify-between items-center">
        <div>
            <p class="text-lg font-semibold">Total a Pagar</p>
            <p class="text-sm text-gray-500">{{ saleData.items.length }} productos</p>
        </div>
        <p class="text-2xl font-bold text-blue-600">{{ formatCurrency(saleData.total) }}</p>
      </div>

      <form @submit.prevent="processSale" class="space-y-4">
        <div>
          <label class="form-label">Método de Pago *</label>
          <select v-model="paymentData.method" class="form-input" @change="onPaymentMethodChange">
            <option v-for="opt in paymentMethods" :key="opt.value" :value="opt.value">{{ opt.title }}</option>
          </select>
        </div>

        <div v-if="paymentData.method.includes('efectivo')" class="grid grid-cols-2 gap-4">
          <div>
            <label class="form-label">Monto Recibido *</label>
            <input type="number" step="0.01" v-model.number="paymentData.receivedAmount" class="form-input" required />
          </div>
          <div>
            <label class="form-label">Cambio</label>
            <input type="text" :value="formatCurrency(changeAmount)" class="form-input bg-gray-100 dark:bg-slate-700" readonly />
          </div>
        </div>

        <!-- Other payment methods -->
        <div v-if="paymentData.method === 'transferencia'" class="grid grid-cols-2 gap-4">
          <div>
            <label class="form-label">Número de Referencia *</label>
            <input type="text" v-model="paymentData.referenceNumber" class="form-input" required />
          </div>
           <div>
            <label class="form-label">Banco</label>
            <select v-model="paymentData.bank" class="form-input">
                <option v-for="bank in banks" :key="bank" :value="bank">{{ bank }}</option>
            </select>
          </div>
        </div>
      </form>
    </div>

    <template #actions>
      <button @click="$emit('update:modelValue', false)" class="button-secondary">Cancelar</button>
      <button @click="processSale" class="button-primary" :disabled="processing">{{ processing ? 'Procesando...' : 'Completar Venta' }}</button>
    </template>
  </BaseDialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import BaseDialog from '../ui/BaseDialog.vue';
import { useSalesStore } from '../../stores/sales';

const props = defineProps({
  modelValue: Boolean,
  saleData: Object
});
const emit = defineEmits(['update:modelValue', 'payment-completed']);

const salesStore = useSalesStore();
const processing = ref(false);

const paymentMethods = [
  { title: 'Efectivo (Bs)', value: 'efectivo_bs' },
  { title: 'Transferencia', value: 'transferencia' },
  // ... other methods
];
const banks = ['Banesco', 'Mercantil', 'Venezuela'];

const paymentData = ref({
  method: 'efectivo_bs',
  receivedAmount: 0,
  referenceNumber: '',
  bank: '',
});

const changeAmount = computed(() => {
  if (!paymentData.value.receivedAmount) return 0;
  return paymentData.value.receivedAmount - props.saleData.total;
});

const onPaymentMethodChange = () => {
    paymentData.value.receivedAmount = 0;
    paymentData.value.referenceNumber = '';
}

const processSale = async () => {
  processing.value = true;
  try {
    const salePayload = {
      ...props.saleData,
      payment: { ...paymentData.value, changeAmount: changeAmount.value }
    };
    const result = await salesStore.createSale(salePayload);
    emit('payment-completed', result);
    emit('update:modelValue', false);
  } catch (error) {
    console.error('Error processing sale:', error);
  } finally {
    processing.value = false;
  }
};

const formatCurrency = (amount) => {
  if (typeof amount !== 'number') return '$0.00';
  return amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    paymentData.value.receivedAmount = props.saleData.total;
  }
});
</script>

<style scoped>
/* Reusing global form styles */
.form-label { @apply block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1; }
.form-input { @apply w-full px-3 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm; }
.button-primary { @apply px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400; }
.button-secondary { @apply px-4 py-2 rounded-lg bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600; }
</style>
