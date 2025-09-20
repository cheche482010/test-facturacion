<template>
  <transition name="fade">
    <div
      v-if="modelValue"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      @click.self="close"
    >
      <transition name="slide-up">
        <div
          v-if="modelValue"
          class="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-lg mx-4"
        >
          <div class="p-6 border-b dark:border-slate-700 flex justify-between items-center">
            <h2 class="text-xl font-semibold">
              <slot name="title">Dialog Title</slot>
            </h2>
            <button @click="close" class="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700">
              <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div class="p-6">
            <slot />
          </div>
          <div v-if="$slots.actions" class="p-6 bg-gray-50 dark:bg-slate-800/50 border-t dark:border-slate-700 flex justify-end space-x-4 rounded-b-lg">
            <slot name="actions" />
          </div>
        </div>
      </transition>
    </div>
  </transition>
</template>

<script setup>
import { defineProps, defineEmits, watch } from 'vue';

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
});

const emit = defineEmits(['update:modelValue']);

const close = () => {
  emit('update:modelValue', false);
};

watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }
});
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}
.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(20px);
  opacity: 0;
}
</style>
