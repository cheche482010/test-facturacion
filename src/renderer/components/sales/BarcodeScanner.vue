<template>
  <v-text-field
    v-model="barcode"
    label="Escanear o ingresar código de barras"
    prepend-inner-icon="mdi-barcode-scan"
    variant="outlined"
    density="compact"
    clearable
    autofocus
    @keyup.enter="onEnter"
    @blur="onEnter"
  />
</template>

<script setup>
import { ref } from 'vue'

const emit = defineEmits(['scanned'])

const barcode = ref('')

/**
 * Emits the scanned event when the user presses Enter or the field loses focus.
 * This allows for both scanner input (which usually appends an Enter key)
 * and manual typing.
 */
const onEnter = () => {
  if (barcode.value && barcode.value.trim() !== '') {
    emit('scanned', barcode.value.trim())
    // Clear the input for the next scan
    barcode.value = ''
  }
}
</script>

<style scoped>
/* You can add specific styles here if needed */
</style>