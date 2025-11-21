const { app, BrowserWindow, Menu, ipcMain, screen } = require("electron")
const path = require("path")
const fs = require("fs")

require("dotenv").config({ path: path.resolve(__dirname, "../../.env") })
const isDev = process.env.NODE_ENV === "development"

if (app && typeof app.disableHardwareAcceleration === 'function') {
  app.disableHardwareAcceleration()
}

const { startServer } = require("./server")
const currencyController = require("./controllers/currencyController")
const DolarService = require("./services/dolarService")

let mainWindow

function createWindow() {
  const primaryDisplay = screen.getPrimaryDisplay()
  const { width, height } = primaryDisplay.workAreaSize

  mainWindow = new BrowserWindow({
    width: width,
    height: height,
    minWidth: 1000,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
    icon: path.join(__dirname, "../../assets/icon.png"),
    show: false,
  })

  if (isDev) {
    mainWindow.loadURL("http://localhost:5173")
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, "../../dist/index.html"))
  }

  mainWindow.once("ready-to-show", () => {
    mainWindow.show()
  })

  mainWindow.on("closed", () => {
    mainWindow = null
  })
}


if (app && typeof app.whenReady === 'function') {
  app.whenReady().then(async () => {
    const uploadsDir = path.join(app.getPath("userData"), "uploads", "products")
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true })
      console.log(`Directorio de subidas creado en: ${uploadsDir}`)
    }
    // --- FIN: Crear directorio de subidas ---

    await startServer()

    await currencyController.updateExchangeRate()
    setInterval(currencyController.updateExchangeRate, 6 * 60 * 60 * 1000) 

    try {
      await DolarService.fetchDolarRate()
    } catch (error) {
      console.error('Error actualizando tasa del dólar al inicio:', error.message)
    }
    setInterval(async () => {
      try {
        await DolarService.fetchDolarRate()
        console.log('Tasa del dólar actualizada automáticamente')
      } catch (error) {
        console.error('Error actualizando tasa del dólar automáticamente:', error.message)
      }
    }, 24 * 60 * 60 * 1000) 

    createWindow()
    Menu.setApplicationMenu(null)
  })
}
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

if (app && typeof app.on === 'function') {
  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
      app.quit()
    }
  })
}

if (ipcMain && typeof ipcMain.handle === 'function') {
  ipcMain.handle("get-app-version", () => {
    return app.getVersion()
  })

  ipcMain.handle("get-app-path", () => {
    return app.getAppPath()
  })
}

require("./routes/settings")
