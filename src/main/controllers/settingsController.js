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

  async saveSettings(event, settingsData) {
    try {
      for (const setting of settingsData) {
        await Settings.upsert(setting)
      }
    } catch (error) {
      console.error("Error saving settings:", error)
      throw error
    }
  }
}

module.exports = settingsController