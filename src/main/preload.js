const { contextBridge, ipcRenderer } = require("electron")

contextBridge.exposeInMainWorld("electronAPI", {
  invoke: (channel, data) => ipcRenderer.invoke(channel, data),
  onMenuAction: (callback) => ipcRenderer.on("menu-action", callback),
  on: (channel, callback) => ipcRenderer.on(channel, (event, ...args) => callback(...args)),
  removeListener: (channel, callback) => ipcRenderer.removeListener(channel, callback),
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),
});
