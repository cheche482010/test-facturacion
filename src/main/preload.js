const { contextBridge, ipcRenderer } = require("electron")

contextBridge.exposeInMainWorld("electronAPI", {
  // General invoke function
  invoke: (channel, data) => ipcRenderer.invoke(channel, data),

  // Specific listeners
  onMenuAction: (callback) => ipcRenderer.on("menu-action", callback),
  on: (channel, callback) => ipcRenderer.on(channel, (event, ...args) => callback(...args)),

  // Clean up listeners
  removeListener: (channel, callback) => ipcRenderer.removeListener(channel, callback),
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),
});
