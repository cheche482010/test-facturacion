const { app, BrowserWindow, Menu, ipcMain } = require("electron")
const path = require("path")
const fs = require("fs")
// Explicitly specify the path to the .env file for robustness
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") })
const isDev = process.env.NODE_ENV === "development"
app.disableHardwareAcceleration()

// Importar el servidor Express
const { startServer } = require("./server")
const currencyController = require("./controllers/currencyController")

let mainWindow

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
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

  // Cargar la aplicación Vue
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

// Configurar menú de la aplicación
function createMenu() {
  const template = [
    {
      label: "Archivo",
      submenu: [
        {
          label: "Nueva Venta",
          accelerator: "CmdOrCtrl+N",
          click: () => {
            mainWindow.webContents.send("menu-action", "new-sale")
          },
        },
        { type: "separator" },
        {
          label: "Configuración",
          click: () => {
            mainWindow.webContents.send("menu-action", "settings")
          },
        },
        { type: "separator" },
        {
          label: "Salir",
          accelerator: process.platform === "darwin" ? "Cmd+Q" : "Ctrl+Q",
          click: () => {
            app.quit()
          },
        },
      ],
    },
    {
      label: "Inventario",
      submenu: [
        {
          label: "Productos",
          click: () => {
            mainWindow.webContents.send("menu-action", "products")
          },
        },
        {
          label: "Stock",
          click: () => {
            mainWindow.webContents.send("menu-action", "inventory")
          },
        },
      ],
    },
    {
      label: "Reportes",
      submenu: [
        {
          label: "Ventas",
          click: () => {
            mainWindow.webContents.send("menu-action", "sales-report")
          },
        },
        {
          label: "Inventario",
          click: () => {
            mainWindow.webContents.send("menu-action", "inventory-report")
          },
        },
      ],
    },
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

app.whenReady().then(async () => {
  // Iniciar servidor Express
  // --- INICIO: Crear directorio de subidas ---
  const uploadsDir = path.join(app.getPath("userData"), "uploads", "products")
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true })
    console.log(`Directorio de subidas creado en: ${uploadsDir}`)
  }
  // --- FIN: Crear directorio de subidas ---

  await startServer()

  // Actualizar la tasa de cambio al inicio y luego periódicamente
  await currencyController.updateExchangeRate()
  setInterval(currencyController.updateExchangeRate, 6 * 60 * 60 * 1000) // Cada 6 horas

  createWindow()
  createMenu()

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit()
  }
})

// IPC handlers
ipcMain.handle("get-app-version", () => {
  return app.getVersion()
})

ipcMain.handle("get-app-path", () => {
  return app.getAppPath()
})

// Import other IPC handlers
require("./routes/settings")
