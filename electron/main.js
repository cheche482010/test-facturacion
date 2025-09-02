const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('path')
const isDev = process.env.NODE_ENV === 'development'

// Iniciar servidor backend
require('../src/backend/server.js')

let mainWindow

function createWindow() {
  // Crear la ventana del navegador
  mainWindow = new BrowserWindow({
    width: parseInt(process.env.WINDOW_WIDTH) || 1200,
    height: parseInt(process.env.WINDOW_HEIGHT) || 800,
    minWidth: parseInt(process.env.WINDOW_MIN_WIDTH) || 800,
    minHeight: parseInt(process.env.WINDOW_MIN_HEIGHT) || 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, '../src/preload.js')
    },
    icon: path.join(__dirname, '../src/assets/images/icon.png'),
    show: false,
    titleBarStyle: 'default'
  })

  // Cargar la aplicación
  if (isDev) {
    // En desarrollo, cargar desde el servidor de desarrollo
    mainWindow.loadURL('http://localhost:3000')
    mainWindow.webContents.openDevTools()
  } else {
    // En producción, cargar desde el build
    const indexPath = path.join(__dirname, '../dist/index.html')
    if (require('fs').existsSync(indexPath)) {
      mainWindow.loadFile(indexPath)
    } else {
      console.error('Archivo de producción no encontrado:', indexPath)
      mainWindow.loadURL('http://localhost:3000')
    }
  }

  // Mostrar ventana cuando esté lista
  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })

  // Manejar cierre de ventana
  mainWindow.on('closed', () => {
    mainWindow = null
  })

  // Manejar errores de carga
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Error al cargar la aplicación:', errorDescription)
    
    if (isDev) {
      // En desarrollo, intentar recargar después de un delay
      setTimeout(() => {
        mainWindow.loadURL('http://localhost:3000')
      }, 2000)
    }
  })
}

// Crear ventana cuando la app esté lista
app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

// Cerrar app cuando todas las ventanas estén cerradas
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// Manejar eventos IPC
ipcMain.handle('select-directory', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  })
  return result.filePaths[0]
})

ipcMain.handle('show-message', async (event, options) => {
  const result = await dialog.showMessageBox(mainWindow, options)
  return result.response
})

ipcMain.handle('show-error', async (event, title, content) => {
  await dialog.showErrorBox(title, content)
})

// Manejar errores no capturados
process.on('uncaughtException', (error) => {
  console.error('Error no capturado:', error)
  dialog.showErrorBox('Error', `Error no capturado: ${error.message}`)
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('Promesa rechazada no manejada:', reason)
  dialog.showErrorBox('Error', `Promesa rechazada: ${reason}`)
})

// Configurar menú de aplicación (opcional)
if (process.platform === 'darwin') {
  const { Menu } = require('electron')
  
  const template = [
    {
      label: app.getName(),
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideothers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    },
    {
      label: 'Editar',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' }
      ]
    },
    {
      label: 'Ver',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Ventana',
      submenu: [
        { role: 'minimize' },
        { role: 'close' }
      ]
    }
  ]
  
  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}
