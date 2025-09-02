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
  const currencyConfig = computed(() => config.value.currency || {})
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
        return config.value
      } else {
        throw new Error(response.data.message || 'Error al cargar configuración')
      }
    } catch (err) {
      error.value = err.response?.data?.message || err.message || 'Error de conexión'
      throw err
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
        config.value = { ...config.value, ...newConfig }
        return response.data
      } else {
        throw new Error(response.data.message || 'Error al guardar configuración')
      }
    } catch (err) {
      error.value = err.response?.data?.message || err.message || 'Error de conexión'
      throw err
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
        return config.value
      } else {
        throw new Error(response.data.message || 'Error al inicializar configuración')
      }
    } catch (err) {
      error.value = err.response?.data?.message || err.message || 'Error de conexión'
      throw err
    } finally {
      loading.value = false
    }
  }

  const getOperationMode = async () => {
    try {
      const response = await axios.get('/api/config/operation-mode')
      
      if (response.data.success) {
        config.value.operation_mode = response.data.data.mode
        return response.data.data.mode
      } else {
        throw new Error(response.data.message || 'Error al obtener modo de operación')
      }
    } catch (err) {
      error.value = err.response?.data?.message || err.message || 'Error de conexión'
      throw err
    }
  }

  const setOperationMode = async (mode) => {
    try {
      loading.value = true
      error.value = null

      const response = await axios.put('/api/config/operation-mode', { mode })
      
      if (response.data.success) {
        config.value.operation_mode = mode
        return response.data
      } else {
        throw new Error(response.data.message || 'Error al cambiar modo de operación')
      }
    } catch (err) {
      error.value = err.response?.data?.message || err.message || 'Error de conexión'
      throw err
    } finally {
      loading.value = false
    }
  }

  const getExchangeRate = async () => {
    try {
      const response = await axios.get('/api/config/exchange-rate')
      
      if (response.data.success) {
        config.value.currency = {
          ...config.value.currency,
          exchange_rate: response.data.data.rate
        }
        return response.data.data
      } else {
        throw new Error(response.data.message || 'Error al obtener tasa de cambio')
      }
    } catch (err) {
      error.value = err.response?.data?.message || err.message || 'Error de conexión'
      throw err
    }
  }

  const setExchangeRate = async (rate) => {
    try {
      loading.value = true
      error.value = null

      const response = await axios.put('/api/config/exchange-rate', { rate })
      
      if (response.data.success) {
        config.value.currency = {
          ...config.value.currency,
          exchange_rate: rate
        }
        return response.data
      } else {
        throw new Error(response.data.message || 'Error al actualizar tasa de cambio')
      }
    } catch (err) {
      error.value = err.response?.data?.message || err.message || 'Error de conexión'
      throw err
    } finally {
      loading.value = false
    }
  }

  const getPrinters = async () => {
    try {
      const response = await axios.get('/api/config/printers')
      
      if (response.data.success) {
        return response.data.data
      } else {
        throw new Error(response.data.message || 'Error al obtener impresoras')
      }
    } catch (err) {
      error.value = err.response?.data?.message || err.message || 'Error de conexión'
      throw err
    }
  }

  const testPrinter = async (printerName) => {
    try {
      loading.value = true
      error.value = null

      const response = await axios.post('/api/config/test-printer', { printer_name: printerName })
      
      if (response.data.success) {
        return response.data
      } else {
        throw new Error(response.data.message || 'Error al probar impresora')
      }
    } catch (err) {
      error.value = err.response?.data?.message || err.message || 'Error de conexión'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Métodos de utilidad
  const formatCurrency = (amount, currency = 'VES') => {
    const rate = currencyConfig.value.exchange_rate || 1
    
    if (currency === 'USD' && currencyConfig.value.primary === 'VES') {
      amount = amount / rate
    } else if (currency === 'VES' && currencyConfig.value.primary === 'USD') {
      amount = amount * rate
    }
    
    return new Intl.NumberFormat('es-VE', {
      style: 'currency',
      currency: currency
    }).format(amount)
  }

  const getBusinessName = () => {
    return businessInfo.value.name || 'Mi Negocio'
  }

  const getBusinessRIF = () => {
    return businessInfo.value.rif || ''
  }

  const getBusinessAddress = () => {
    return businessInfo.value.address || ''
  }

  const getBusinessPhone = () => {
    return businessInfo.value.phone || ''
  }

  const getDefaultTaxRate = () => {
    return invoiceConfig.value.default_tax_rate || 16
  }

  const isInvoiceTaxIncluded = () => {
    return invoiceConfig.value.include_tax !== false
  }

  const getInvoicePrefix = () => {
    return invoiceConfig.value.prefix || 'F'
  }

  const getCurrentInvoiceNumber = () => {
    return invoiceConfig.value.current_number || 1
  }

  const isAutoBackupEnabled = () => {
    return backupConfig.value.auto_backup !== false
  }

  const getBackupInterval = () => {
    return backupConfig.value.backup_interval || 24
  }

  const getKeepBackupsDays = () => {
    return backupConfig.value.keep_backups || 7
  }

  const isLowStockNotificationEnabled = () => {
    return notificationConfig.value.low_stock !== false
  }

  const isOverduePaymentNotificationEnabled = () => {
    return notificationConfig.value.overdue_payments !== false
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
    
    // Métodos de utilidad
    formatCurrency,
    getBusinessName,
    getBusinessRIF,
    getBusinessAddress,
    getBusinessPhone,
    getDefaultTaxRate,
    isInvoiceTaxIncluded,
    getInvoicePrefix,
    getCurrentInvoiceNumber,
    isAutoBackupEnabled,
    getBackupInterval,
    getKeepBackupsDays,
    isLowStockNotificationEnabled,
    isOverduePaymentNotificationEnabled
  }
})

