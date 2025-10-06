const Settings = require("../database/models/Settings");
const currencyService = require("../services/currencyService");

const currencyController = {
  async getExchangeRate() {
    try {
      const rateSetting = await Settings.findOne({ where: { key: 'exchange_rate_bcv' } });
      return rateSetting;
    } catch (error) {
      console.error("Error getting exchange rate:", error);
      throw error;
    }
  },

  async updateExchangeRate() {
    try {
      const rate = await currencyService.getOfficialRate();
      if (rate) {
        const rateSetting = {
          key: 'exchange_rate_bcv',
          value: rate.toString(),
          dataType: 'number',
          category: 'currency',
          description: 'Tasa de cambio oficial del BCV'
        };
        await Settings.upsert(rateSetting);
        return rateSetting;
      }
    } catch (error) {
      console.error("Error updating exchange rate:", error);
      throw error;
    }
  }
};

module.exports = currencyController;
