import { defineStore } from "pinia"

export const useAppStore = defineStore("app", {
  state: () => ({
    user: null,
    settings: {
      // General
      currency: "VES",
      language: "es",
      timezone: "America/Caracas",
      // Interface
      companyName: "FacturaPro",
      companySlogan: "Sistema de Facturación",
      companyLogo: null,
      darkMode: false,
      primaryColor: "#1976D2",
      // Company
      companyRif: "",
      companyAddress: "",
      companyPhone: "",
      companyEmail: "",
      // Billing
      invoicePrefix: "FAC-",
      nextInvoiceNumber: 1,
      taxRate: 16,
      autoCalculateTax: true,
      // System
      autoBackup: false,
      backupInterval: 24,
    },
  }),

  getters: {
    isAuthenticated: (state) => !!state.user,
  },

  actions: {
    setUser(user) {
      this.user = user
    },

    async loadSettings() {
      try {
        const settingsFromDB = await window.electronAPI.invoke('get-settings');
        if (settingsFromDB && settingsFromDB.length > 0) {
          const settingsObject = settingsFromDB.reduce((obj, item) => {
            // Attempt to parse boolean/number strings
            let value = item.value;
            if (value === 'true') value = true;
            else if (value === 'false') value = false;
            else if (!isNaN(parseFloat(value)) && isFinite(value)) value = parseFloat(value);
            obj[item.key] = value;
            return obj;
          }, {});
          this.settings = { ...this.settings, ...settingsObject };
        }
      } catch (error) {
        console.error("Error loading settings from backend:", error);
      }
    },

    async saveSettings(settingsToSave) {
      try {
        // Transform the settings object into an array of key-value pairs
        const settingsArray = Object.entries(settingsToSave).map(([key, value]) => ({
          key,
          // Convert value to string for consistent storage, except for objects (like logo)
          value: typeof value === 'object' && value !== null ? JSON.stringify(value) : String(value),
        }));

        await window.electronAPI.invoke('save-settings', settingsArray);
        // After saving, update the local state
        this.settings = { ...this.settings, ...settingsToSave };
      } catch (error) {
        console.error("Error saving settings to backend:", error);
        throw error; // Re-throw to be caught in the component
      }
    },

    logout() {
      this.user = null
    },
  },
})