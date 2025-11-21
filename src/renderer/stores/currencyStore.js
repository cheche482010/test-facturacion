import { defineStore } from 'pinia';
import api from '../services/api';

export const useCurrencyStore = defineStore('currency', {
  state: () => ({
    exchangeRate: 230.10, 
  }),
  actions: {
    async fetchExchangeRate() {
      try {
        const result = await window.electronAPI.invoke('get-current-dolar-rate');
        if (result.success && result.data) {
          this.exchangeRate = parseFloat(result.data.dataValues.rate);
        }
      } catch (error) {
        console.error('Error fetching exchange rate:', error);
      }
    },
    async updateExchangeRate() {
      try {
        const result = await window.electronAPI.invoke('update-dolar-rate');
        if (result.success && result.data) {
          this.exchangeRate = parseFloat(result.data.dataValues.rate);
        }
      } catch (error) {
        console.error('Error updating exchange rate:', error);
      }
    },
  },
});
