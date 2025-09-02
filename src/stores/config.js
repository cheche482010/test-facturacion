import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'

export const useConfigStore = defineStore('config', () => {
  // Estado
  const config = ref({})
  const loading = ref(false)
  const error = ref(null)
  const isLoaded = ref(false)

  // Getters
  const operationMode = computed(() => config.value.operation_mode || 'bodega')
  const businessInfo = computed(() => config.value.business || {})
  const invoiceConfig = computed(() => config.value.invoice || {})
  const currencyConfig = computed(() => config.value.exchange_rate || {})
  const printerConfig = computed(() => config.value.printer || {})
  const backupConfig = computed(() => config.value.backup || {})
  const notificationConfig = computed(() => config.value.notifications || {})

  // Métodos
  const loadConfig = async () => {
    try {
      loading.value = true
      error.value = null

      const response = await axios.get('/api/config')
      
      if (response.data.success) {
        config.value = response.data.data
        isLoaded.value = true
        return { success: true }
      } else {
        error.value = response.data.message
        return { success: false, message: response.data.message }
      }
    } catch (err) {
      error.value = err.response?.data?.message || 'Error de conexión'
      return { success: false, message: error.value }
    } finally {
      loading.value = false
    }
  }

  const saveConfig = async (newConfig) => {
    try {
      loading.value = true
      error.value = null

      const response = await axios.put('/api/config', newConfig)
      
      if (response.data.success) {
        config.value = response.data.data
        return { success: true, message: response.data.message }
      } else {
        error.value = response.data.message
        return { success: false, message: response.data.message }
      }
    } catch (err) {
      error.value = err.response?.data?.message || 'Error de conexión'
      return { success: false, message: error.value }
    } finally {
      loading.value = false
    }
  }

  const initConfig = async () => {
    try {
      loading.value = true
      error.value = null

      const response = await axios.post('/api/config/init')
      
      if (response.data.success) {
        config.value = response.data.data
        isLoaded.value = true
        return { success: true, message: response.data.message }
      } else {
        error.value = response.data.message
        return { success: false, message: response.data.message }
      }
    } catch (err) {
      error.value = err.response?.data?.message || 'Error de conexión'
      return { success: false, message: error.value }
    } finally {
      loading.value = false
    }
  }

  const getOperationMode = async () => {
    try {
      const response = await axios.get('/api/config/operation-mode')
      
      if (response.data.success) {
        config.value.operation_mode = response.data.data.mode
        return { success: true, mode: response.data.data.mode }
      } else {
        return { success: false, message: response.data.message }
      }
    } catch (err) {
      return { success: false, message: 'Error de conexión' }
    }
  }

  const setOperationMode = async (mode) => {
    try {
      loading.value = true
      error.value = null

      const response = await axios.put('/api/config/operation-mode', { mode })
      
      if (response.data.success) {
        config.value.operation_mode = mode
        return { success: true, message: response.data.message }
      } else {
        error.value = response.data.message
        return { success: false, message: response.data.message }
      }
    } catch (err) {
      error.value = err.response?.data?.message || 'Error de conexión'
      return { success: false, message: error.value }
    } finally {
      loading.value = false
    }
  }

  const getExchangeRate = async () => {
    try {
      const response = await axios.get('/api/config/exchange-rate')
      
      if (response.data.success) {
        config.value.exchange_rate = {
          ...config.value.exchange_rate,
          ...response.data.data
        }
        return { success: true, data: response.data.data }
      } else {
        return { success: false, message: response.data.message }
      }
    } catch (err) {
      return { success: false, message: 'Error de conexión' }
    }
  }

  const setExchangeRate = async (rateData) => {
    try {
      loading.value = true
      error.value = null

      const response = await axios.put('/api/config/exchange-rate', rateData)
      
      if (response.data.success) {
        config.value.exchange_rate = {
          ...config.value.exchange_rate,
          ...response.data.data
        }
        return { success: true, message: response.data.message }
      } else {
        error.value = response.data.message
        return { success: false, message: response.data.message }
      }
    } catch (err) {
      error.value = err.response?.data?.message || 'Error de conexión'
      return { success: false, message: error.value }
    } finally {
      loading.value = false
    }
  }

  const getPrinters = async () => {
    try {
      const response = await axios.get('/api/config/printers')
      
      if (response.data.success) {
        return { success: true, printers: response.data.data }
      } else {
        return { success: false, message: response.data.message }
      }
    } catch (err) {
      return { success: false, message: 'Error de conexión' }
    }
  }

  const testPrinter = async (printerName) => {
    try {
      loading.value = true
      error.value = null

      const response = await axios.post('/api/config/test-printer', { printer_name: printerName })
      
      if (response.data.success) {
        return { success: true, message: response.data.message }
      } else {
        error.value = response.data.message
        return { success: false, message: response.data.message }
      }
    } catch (err) {
      error.value = err.response?.data?.message || 'Error de conexión'
      return { success: false, message: error.value }
    } finally {
      loading.value = false
    }
  }

  // Utilidades
  const formatCurrency = (amount, currency = 'VES') => {
    if (currency === 'USD') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(amount)
    } else {
      return new Intl.NumberFormat('es-VE', {
        style: 'currency',
        currency: 'VES'
      }).format(amount)
    }
  }

  const getBusinessName = () => {
    return businessInfo.value.name || 'Mi Negocio'
  }

  const getDefaultTaxRate = () => {
    return invoiceConfig.value.tax_rate || 16
  }

  const getExchangeRateValue = () => {
    return currencyConfig.value.value || 1
  }

  const isStoreMode = () => {
    return operationMode.value === 'tienda'
  }

  const isWarehouseMode = () => {
    return operationMode.value === 'bodega'
  }

  return {
    // Estado
    config,
    loading,
    error,
    isLoaded,
    
    // Getters
    operationMode,
    businessInfo,
    invoiceConfig,
    currencyConfig,
    printerConfig,
    backupConfig,
    notificationConfig,
    
    // Métodos
    loadConfig,
    saveConfig,
    initConfig,
    getOperationMode,
    setOperationMode,
    getExchangeRate,
    setExchangeRate,
    getPrinters,
    testPrinter,
    
    // Utilidades
    formatCurrency,
    getBusinessName,
    getDefaultTaxRate,
    getExchangeRateValue,
    isStoreMode,
    isWarehouseMode
  }
})

