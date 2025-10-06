import { defineStore } from 'pinia';
import api from '../services/api';

export const useCurrencyStore = defineStore('currency', {
  state: () => ({
    exchangeRate: null,
  }),
  actions: {
    async fetchExchangeRate() {
      try {
        const response = await api.get('/currency/exchange-rate');
        if (response.data && response.data.value) {
          this.exchangeRate = parseFloat(response.data.value);
        }
      } catch (error) {
        console.error('Error fetching exchange rate:', error);
      }
    },
    async updateExchangeRate() {
      try {
        const response = await api.post('/currency/exchange-rate/update');
        if (response.data && response.data.value) {
          this.exchangeRate = parseFloat(response.data.value);
        }
      } catch (error) {
        console.error('Error updating exchange rate:', error);
      }
    },
  },
});
