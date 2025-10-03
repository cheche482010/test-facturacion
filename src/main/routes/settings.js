const { ipcMain } = require("electron")
const settingsController = require("../controllers/settingsController")

ipcMain.handle("get-settings", settingsController.getSettings)
ipcMain.handle("save-settings", settingsController.saveSettings)