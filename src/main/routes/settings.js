const { ipcMain } = require("electron")
const settingsController = require("../controllers/settingsController")

if (ipcMain && typeof ipcMain.handle === 'function') {
  ipcMain.handle("get-settings", settingsController.getSettings)
  ipcMain.handle("save-settings", settingsController.saveSettings)
}