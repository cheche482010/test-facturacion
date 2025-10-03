import { defineStore } from "pinia"

export const useAppStore = defineStore("app", {
  state: () => ({
    mode: "bodega", // 'bodega' o 'tienda'
    user: null,
    settings: {
      companyName: "",
      rif: "",
      address: "",
      phone: "",
      email: "",
      currency: "VES",
      exchangeRate: 1,
      darkMode: false,
    },
  }),

  getters: {
    isAuthenticated: (state) => !!state.user,
    isBodegaMode: (state) => state.mode === "bodega",
    isTiendaMode: (state) => state.mode === "tienda",
  },

  actions: {
    setMode(mode) {
      this.mode = mode
    },

    setUser(user) {
      this.user = user
    },

    updateSettings(settings) {
      this.settings = { ...this.settings, ...settings }
    },

    async saveSettings(newSettings) {
      // In a real app, this would save to a file via IPC
      this.settings = { ...this.settings, ...newSettings };
      console.log("Settings saved:", this.settings);
    },

    async loadSettings() {
      // In a real app, this would load from a file via IPC
      console.log("Loading settings...");
    },

    logout() {
      this.user = null
    },
  },
})
