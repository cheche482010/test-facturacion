const { ipcMain } = require("electron")
const express = require('express')
const router = express.Router()
const settingsController = require("../controllers/settingsController")
const Settings = require("../database/models/Settings")
const DolarService = require("../services/dolarService")

router.get('/', async (req, res) => {
  try {
    const settings = await Settings.findAll()
    res.json(settings)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/company', async (req, res) => {
  try {
    const settings = await Settings.findAll({ where: { category: 'company' } })
    res.json(settings)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/', async (req, res) => {
  try {
    const settingsData = req.body
    for (const setting of settingsData) {
      await Settings.upsert(setting)
    }
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})


if (ipcMain && typeof ipcMain.handle === 'function') {
  ipcMain.handle("get-settings", settingsController.getSettings)
  ipcMain.handle("get-company-settings", settingsController.getCompanySettings)
  ipcMain.handle("save-settings", settingsController.saveSettings)

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

module.exports = router