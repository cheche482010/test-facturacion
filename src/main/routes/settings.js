const { ipcMain } = require("electron")
const settingsController = require("../controllers/settingsController")
const DolarService = require("../services/dolarService")

if (ipcMain && typeof ipcMain.handle === 'function') {
  ipcMain.handle("get-settings", settingsController.getSettings)
  ipcMain.handle("save-settings", settingsController.saveSettings)

  // Dolar rate handlers
  ipcMain.handle("get-current-dolar-rate", async () => {
    try {
      const rate = await DolarService.getCurrentDolarRate()
      return { success: true, data: rate }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle("get-dolar-history", async (event, limit = 30) => {
    try {
      const history = await DolarService.getDolarHistory(limit)
      return { success: true, data: history }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle("update-dolar-rate", async (event, rate, date = null) => {
    try {
      const result = await DolarService.updateDolarRate(rate, date)
      return { success: true, data: result }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle("fetch-dolar-rate", async () => {
    try {
      const rate = await DolarService.fetchDolarRate()
      return { success: true, data: rate }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle("convert-to-bs", async (event, usdAmount) => {
    try {
      const bsAmount = await DolarService.convertToBs(usdAmount)
      return { success: true, data: bsAmount }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })
}