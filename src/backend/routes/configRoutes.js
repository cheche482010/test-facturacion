const express = require('express')
const fs = require('fs')
const path = require('path')
const axios = require('axios')
const { validateToken, checkPermission } = require('../middleware/auth')

const router = express.Router()

// Configuración por defecto
const getDefaultConfig = () => ({
  business: {
    name: 'Mi Negocio',
    rif: '',
    address: '',
    phone: '',
    email: '',
    website: ''
  },
  invoice: {
    series: 'A',
    start_number: 1,
    prefix: 'F',
    tax_rate: 16,
    currency: 'VES',
    language: 'es'
  },
  operation_mode: 'bodega', // bodega o tienda
  exchange_rate: {
    mode: 'manual', // manual o automatic
    value: 1,
    api_url: 'https://ve.dolarapi.com/v1/dolares/oficial',
    last_update: null
  },
  printer: {
    default_printer: '',
    ticket_width: 80,
    show_logo: true,
    show_qr: false
  },
  backup: {
    auto_backup: false,
    backup_interval: 24, // horas
    keep_backups: 7, // días
    backup_path: ''
  },
  notifications: {
    low_stock: true,
    overdue_payments: true,
    email_notifications: false,
    sms_notifications: false
  }
})

// Rutas para el archivo de configuración
const configPath = path.join(__dirname, '../../../data/config.json')

const readConfig = () => {
  try {
    if (fs.existsSync(configPath)) {
      const configData = fs.readFileSync(configPath, 'utf8')
      return JSON.parse(configData)
    }
  } catch (error) {
    console.error('Error al leer configuración:', error)
  }
  return getDefaultConfig()
}

const writeConfig = (config) => {
  try {
    // Crear directorio si no existe
    const configDir = path.dirname(configPath)
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true })
    }
    
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2))
    return true
  } catch (error) {
    console.error('Error al escribir configuración:', error)
    return false
  }
}

// GET /api/config - Obtener configuración
router.get('/', validateToken, checkPermission('config', 'read'), (req, res) => {
  try {
    const config = readConfig()
    res.json({
      success: true,
      data: config
    })
  } catch (error) {
    console.error('Error al obtener configuración:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
})

// PUT /api/config - Actualizar configuración
router.put('/', validateToken, checkPermission('config', 'update'), (req, res) => {
  try {
    const currentConfig = readConfig()
    const updatedConfig = { ...currentConfig, ...req.body }
    
    if (writeConfig(updatedConfig)) {
      res.json({
        success: true,
        message: 'Configuración actualizada exitosamente',
        data: updatedConfig
      })
    } else {
      res.status(500).json({
        success: false,
        message: 'Error al guardar la configuración'
      })
    }
  } catch (error) {
    console.error('Error al actualizar configuración:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
})

// POST /api/config/init - Inicializar configuración por defecto
router.post('/init', (req, res) => {
  try {
    const defaultConfig = getDefaultConfig()
    
    if (writeConfig(defaultConfig)) {
      res.json({
        success: true,
        message: 'Configuración inicializada exitosamente',
        data: defaultConfig
      })
    } else {
      res.status(500).json({
        success: false,
        message: 'Error al inicializar la configuración'
      })
    }
  } catch (error) {
    console.error('Error al inicializar configuración:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
})

// GET /api/config/operation-mode - Obtener modo de operación
router.get('/operation-mode', validateToken, checkPermission('config', 'read'), (req, res) => {
  try {
    const config = readConfig()
    res.json({
      success: true,
      data: {
        mode: config.operation_mode
      }
    })
  } catch (error) {
    console.error('Error al obtener modo de operación:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
})

// PUT /api/config/operation-mode - Cambiar modo de operación
router.put('/operation-mode', validateToken, checkPermission('config', 'update'), (req, res) => {
  try {
    const { mode } = req.body
    
    if (!mode || !['bodega', 'tienda'].includes(mode)) {
      return res.status(400).json({
        success: false,
        message: 'Modo de operación inválido'
      })
    }
    
    const config = readConfig()
    config.operation_mode = mode
    
    if (writeConfig(config)) {
      res.json({
        success: true,
        message: `Modo de operación cambiado a: ${mode}`,
        data: {
          mode: config.operation_mode
        }
      })
    } else {
      res.status(500).json({
        success: false,
        message: 'Error al guardar la configuración'
      })
    }
  } catch (error) {
    console.error('Error al cambiar modo de operación:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
})

// GET /api/config/exchange-rate - Obtener tasa de cambio
router.get('/exchange-rate', validateToken, checkPermission('config', 'read'), async (req, res) => {
  try {
    const config = readConfig()
    const exchangeConfig = config.exchange_rate
    
    if (exchangeConfig.mode === 'automatic') {
      try {
        const response = await axios.get(exchangeConfig.api_url, {
          timeout: 5000
        })
        
        if (response.data && response.data.venta) {
          const newRate = parseFloat(response.data.venta)
          config.exchange_rate.value = newRate
          config.exchange_rate.last_update = new Date().toISOString()
          writeConfig(config)
          
          res.json({
            success: true,
            data: {
              value: newRate,
              mode: exchangeConfig.mode,
              last_update: config.exchange_rate.last_update,
              source: 'API'
            }
          })
        } else {
          res.json({
            success: true,
            data: {
              value: exchangeConfig.value,
              mode: exchangeConfig.mode,
              last_update: exchangeConfig.last_update,
              source: 'Manual (API no disponible)'
            }
          })
        }
      } catch (apiError) {
        console.error('Error al obtener tasa de cambio de API:', apiError)
        res.json({
          success: true,
          data: {
            value: exchangeConfig.value,
            mode: exchangeConfig.mode,
            last_update: exchangeConfig.last_update,
            source: 'Manual (Error API)'
          }
        })
      }
    } else {
      res.json({
        success: true,
        data: {
          value: exchangeConfig.value,
          mode: exchangeConfig.mode,
          last_update: exchangeConfig.last_update,
          source: 'Manual'
        }
      })
    }
  } catch (error) {
    console.error('Error al obtener tasa de cambio:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
})

// PUT /api/config/exchange-rate - Actualizar tasa de cambio
router.put('/exchange-rate', validateToken, checkPermission('config', 'update'), (req, res) => {
  try {
    const { value, mode } = req.body
    
    if (value && (isNaN(value) || value <= 0)) {
      return res.status(400).json({
        success: false,
        message: 'Valor de tasa de cambio inválido'
      })
    }
    
    if (mode && !['manual', 'automatic'].includes(mode)) {
      return res.status(400).json({
        success: false,
        message: 'Modo de tasa de cambio inválido'
      })
    }
    
    const config = readConfig()
    
    if (value !== undefined) {
      config.exchange_rate.value = parseFloat(value)
    }
    
    if (mode) {
      config.exchange_rate.mode = mode
    }
    
    config.exchange_rate.last_update = new Date().toISOString()
    
    if (writeConfig(config)) {
      res.json({
        success: true,
        message: 'Tasa de cambio actualizada exitosamente',
        data: {
          value: config.exchange_rate.value,
          mode: config.exchange_rate.mode,
          last_update: config.exchange_rate.last_update
        }
      })
    } else {
      res.status(500).json({
        success: false,
        message: 'Error al guardar la configuración'
      })
    }
  } catch (error) {
    console.error('Error al actualizar tasa de cambio:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
})

// GET /api/config/printers - Obtener impresoras disponibles
router.get('/printers', validateToken, checkPermission('config', 'read'), (req, res) => {
  try {
    // En una implementación real, esto obtendría las impresoras del sistema
    // Por ahora, retornamos una lista de ejemplo
    const printers = [
      { name: 'Microsoft Print to PDF', isDefault: true },
      { name: 'HP LaserJet Pro', isDefault: false },
      { name: 'Epson TM-T88VI', isDefault: false }
    ]
    
    res.json({
      success: true,
      data: printers
    })
  } catch (error) {
    console.error('Error al obtener impresoras:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
})

// POST /api/config/test-printer - Probar impresora
router.post('/test-printer', validateToken, checkPermission('config', 'update'), (req, res) => {
  try {
    const { printer_name } = req.body
    
    if (!printer_name) {
      return res.status(400).json({
        success: false,
        message: 'Nombre de impresora requerido'
      })
    }
    
    // En una implementación real, esto enviaría una página de prueba a la impresora
    // Por ahora, simulamos el proceso
    
    setTimeout(() => {
      res.json({
        success: true,
        message: 'Página de prueba enviada exitosamente',
        data: {
          printer: printer_name,
          status: 'success'
        }
      })
    }, 1000)
    
  } catch (error) {
    console.error('Error al probar impresora:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
})

// GET /api/config/backup - Obtener configuración de backup
router.get('/backup', validateToken, checkPermission('config', 'read'), (req, res) => {
  try {
    const config = readConfig()
    res.json({
      success: true,
      data: config.backup
    })
  } catch (error) {
    console.error('Error al obtener configuración de backup:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
})

// PUT /api/config/backup - Actualizar configuración de backup
router.put('/backup', validateToken, checkPermission('config', 'update'), (req, res) => {
  try {
    const { auto_backup, backup_interval, keep_backups, backup_path } = req.body
    
    const config = readConfig()
    
    if (auto_backup !== undefined) {
      config.backup.auto_backup = Boolean(auto_backup)
    }
    
    if (backup_interval !== undefined) {
      config.backup.backup_interval = parseInt(backup_interval)
    }
    
    if (keep_backups !== undefined) {
      config.backup.keep_backups = parseInt(keep_backups)
    }
    
    if (backup_path !== undefined) {
      config.backup.backup_path = backup_path
    }
    
    if (writeConfig(config)) {
      res.json({
        success: true,
        message: 'Configuración de backup actualizada exitosamente',
        data: config.backup
      })
    } else {
      res.status(500).json({
        success: false,
        message: 'Error al guardar la configuración'
      })
    }
  } catch (error) {
    console.error('Error al actualizar configuración de backup:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
})

// GET /api/config/notifications - Obtener configuración de notificaciones
router.get('/notifications', validateToken, checkPermission('config', 'read'), (req, res) => {
  try {
    const config = readConfig()
    res.json({
      success: true,
      data: config.notifications
    })
  } catch (error) {
    console.error('Error al obtener configuración de notificaciones:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
})

// PUT /api/config/notifications - Actualizar configuración de notificaciones
router.put('/notifications', validateToken, checkPermission('config', 'update'), (req, res) => {
  try {
    const { low_stock, overdue_payments, email_notifications, sms_notifications } = req.body
    
    const config = readConfig()
    
    if (low_stock !== undefined) {
      config.notifications.low_stock = Boolean(low_stock)
    }
    
    if (overdue_payments !== undefined) {
      config.notifications.overdue_payments = Boolean(overdue_payments)
    }
    
    if (email_notifications !== undefined) {
      config.notifications.email_notifications = Boolean(email_notifications)
    }
    
    if (sms_notifications !== undefined) {
      config.notifications.sms_notifications = Boolean(sms_notifications)
    }
    
    if (writeConfig(config)) {
      res.json({
        success: true,
        message: 'Configuración de notificaciones actualizada exitosamente',
        data: config.notifications
      })
    } else {
      res.status(500).json({
        success: false,
        message: 'Error al guardar la configuración'
      })
    }
  } catch (error) {
    console.error('Error al actualizar configuración de notificaciones:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
})

module.exports = router
