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

    logout() {
      this.user = null
    },
  },
})
