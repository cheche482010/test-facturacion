const Settings = require("../database/models/Settings")

const settingsController = {
  async getSettings() {
    try {
      const settings = await Settings.findAll()
      return settings
    } catch (error) {
      console.error("Error getting settings:", error)
      throw error
    }
  },

  async getCompanySettings() {
    try {
      const settings = await Settings.findAll({ where: { category: "company" } })
      return settings
    } catch (error) {
      console.error("Error getting company settings:", error)
      throw error
    }
  },

  async saveSettings(event, settingsData) {
    try {
      console.log('Saving settings:', settingsData)
      for (const setting of settingsData) {
        await Settings.upsert(setting)
      }
      console.log('Settings saved successfully')
    } catch (error) {
      console.error("Error saving settings:", error)
      throw error
    }
  }
}

module.exports = settingsController