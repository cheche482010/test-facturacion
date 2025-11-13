<template>
  <v-card class="mt-4">
    <v-card-title>Conversor de Moneda</v-card-title>
    <v-card-text>
      <div class="d-flex align-center justify-center mb-4">
        <v-select
          v-model="fromCurrency"
          :items="currencies"
          item-title="name"
          item-value="code"
          label="De"
          variant="outlined"
          density="compact"
          class="mr-2 currency-select"
        >
          <template #item="{ item }">
            <vue-country-flag :country="item.raw.countryCode" size="small" class="mr-2" />
            {{ item.raw.name }}
          </template>
          <template #selection="{ item }">
            <vue-country-flag :country="item.raw.countryCode" size="small" class="mr-2" />
            {{ item.raw.name }}
          </template>
        </v-select>
        <v-btn icon="mdi-swap-horizontal" @click="swapCurrencies" class="mx-1"></v-btn>
        <v-select
          v-model="toCurrency"
          :items="currencies"
          item-title="name"
          item-value="code"
          label="A"
          variant="outlined"
          density="compact"
          class="ml-2 currency-select"
        >
          <template #item="{ item }">
            <vue-country-flag :country="item.raw.countryCode" size="small" class="mr-2" />
            {{ item.raw.name }}
          </template>
          <template #selection="{ item }">
            <vue-country-flag :country="item.raw.countryCode" size="small" class="mr-2" />
            {{ item.raw.name }}
          </template>
        </v-select>
      </div>

      <div class="d-flex justify-center mb-4">
        <v-text-field
          v-model.number="amount"
          label="Monto"
          type="number"
          variant="outlined"
          density="compact"
          class="amount-input"
        />
      </div>

      <div v-if="convertedAmount !== null" class="text-h6 text-center">
        Resultado: {{ formatCurrency(convertedAmount, toCurrency) }}
      </div>

      <div class="text-caption text-medium-emphasis mt-2 text-center">
        Tasa de cambio actual: 1 USD = {{ formatCurrency(exchangeRate, 'VES') }} Bs
      </div>
    </v-card-text>
  </v-card>
</template>

<script>
import CurrencyConverter from './CurrencyConverter.js'

export default CurrencyConverter
</script>

<style scoped lang="scss">
@use './CurrencyConverter.scss';
</style>