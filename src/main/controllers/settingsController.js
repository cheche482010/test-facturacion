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
    // Note: This is not secure without getting the user from the event
    const user = { role: 'dev' } // TODO: Get user from a secure source
    if (user.role !== 'dev') {
      throw new Error("Unauthorized")
    }
    try {
      for (const setting of settingsData) {
        await Settings.upsert(setting)
      }
    } catch (error) {
      console.error("Error saving settings:", error)
      throw error
    }
  },
}

module.exports = settingsController