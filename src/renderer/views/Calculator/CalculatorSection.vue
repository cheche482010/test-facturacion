<template>
  <div>
    <!-- Header -->
    <div class="d-flex justify-space-between align-center mb-4">
      <div class="d-flex align-center">
        <div class="ml-2">
          <h1 class="text-h5 font-weight-bold">Calculadora</h1>
          <p class="text-medium-emphasis">Herramientas de cálculo y conversión de moneda.</p>
        </div>
      </div>
    </div>

    <v-tabs v-model="tab" color="primary">
      <v-tab value="calculator">Calculadora Estándar</v-tab>
      <v-tab value="converter">Conversor de Moneda</v-tab>
    </v-tabs>

    <v-window v-model="tab">
      <v-window-item value="calculator">
        <v-card class="mt-4">
          <v-card-title>Calculadora Estándar</v-card-title>
          <v-card-text>
            <Calculator />
          </v-card-text>
        </v-card>
      </v-window-item>

      <v-window-item value="converter">
        <CurrencyConverter />
      </v-window-item>
    </v-window>
  </div>
</template>

<script>
import CalculatorSection from './CalculatorSection.js'

export default CalculatorSection
</script>
