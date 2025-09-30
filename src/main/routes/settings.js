const { ipcMain } = require("electron");
const Settings = require("../database/models/Settings");

// Get all settings
ipcMain.handle("get-settings", async () => {
  try {
    const settings = await Settings.findAll();
    return settings;
  } catch (error) {
    console.error("Error getting settings:", error);
    throw error;
  }
});

// Save all settings
ipcMain.handle("save-settings", async (event, settingsData) => {
  try {
    for (const setting of settingsData) {
      await Settings.upsert(setting);
    }
  } catch (error) {
    console.error("Error saving settings:", error);
    throw error;
  }
});