<template>
  <div class="calculator">
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

<style scoped>
.calculator {
  max-width: 300px;
  margin: 0 auto;
}

.calculator-display {
  font-size: 1.2rem;
  text-align: right;
}

.calculator-btn {
  height: 48px;
  font-size: 1.1rem;
  font-weight: 500;
}
</style>
