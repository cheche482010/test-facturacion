const { contextBridge, ipcRenderer } = require('electron')

// Exponer APIs protegidas al renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Diálogos del sistema
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  showMessage: (options) => ipcRenderer.invoke('show-message', options),
  
  // Configuración de la aplicación
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  getAppPath: () => ipcRenderer.invoke('get-app-path'),
  
  // Base de datos
  initDatabase: (config) => ipcRenderer.invoke('init-database', config),
  backupDatabase: (path) => ipcRenderer.invoke('backup-database', path),
  restoreDatabase: (path) => ipcRenderer.invoke('restore-database', path),
  
  // Impresión
  printTicket: (data) => ipcRenderer.invoke('print-ticket', data),
  printInvoice: (data) => ipcRenderer.invoke('print-invoice', data),
  
  // Hardware
  getPrinters: () => ipcRenderer.invoke('get-printers'),
  testPrinter: (printerName) => ipcRenderer.invoke('test-printer', printerName),
  
  // Notificaciones del sistema
  showNotification: (title, body) => ipcRenderer.invoke('show-notification', title, body),
  
  // Configuración
  getConfig: () => ipcRenderer.invoke('get-config'),
  saveConfig: (config) => ipcRenderer.invoke('save-config', config),
  
  // Modo de operación
  getOperationMode: () => ipcRenderer.invoke('get-operation-mode'),
  setOperationMode: (mode) => ipcRenderer.invoke('set-operation-mode', mode)
})

// Exponer utilidades
contextBridge.exposeInMainWorld('utils', {
  formatCurrency: (amount, currency = 'VES') => {
    return new Intl.NumberFormat('es-VE', {
      style: 'currency',
      currency: currency
    }).format(amount)
  },
  
  formatDate: (date) => {
    return new Intl.DateTimeFormat('es-VE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(new Date(date))
  },
  
  generateBarcode: (code) => {
    // Implementar generación de código de barras
    return code
  },
  
  calculateTax: (amount, taxRate) => {
    return amount * (taxRate / 100)
  },
  
  calculateTotal: (subtotal, tax, discount = 0) => {
    return subtotal + tax - discount
  }
})

