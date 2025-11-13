<template>
  <div class="calculator" @keydown="handleKeyDown" tabindex="0">
    <div class="calculator-expression mb-2">{{ expression }}</div>
    <v-text-field
      v-model="display"
      variant="outlined"
      readonly
      class="calculator-display mb-2"
      density="compact"
    />
    
    <v-row dense>
      <v-col v-for="button in buttons" :key="button.value" :cols="button.cols || 3">
        <v-btn
          :color="button.color || 'default'"
          :variant="button.variant || 'outlined'"
          block
          @click="handleClick(button.value)"
          class="calculator-btn"
        >
          {{ button.label }}
        </v-btn>
      </v-col>
    </v-row>
  </div>
</template>

<script>
import calculatorLogic from './Calculator.js'

export default calculatorLogic
</script>

<style scoped lang="scss">
@use './Calculator.scss';
</style>
