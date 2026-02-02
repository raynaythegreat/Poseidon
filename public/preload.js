const { contextBridge, ipcRenderer } = require("electron")

// Set a flag immediately when the preload script runs (before page loads)
if (typeof globalThis.window !== 'undefined') {
  globalThis.window.__IS_ELECTRON__ = true;
}

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld("electronAPI", {
  // App info
  getVersion: () => ipcRenderer.invoke("app-version"),
  getPlatform: () => ipcRenderer.invoke("platform"),

  // Menu events
  onNewChat: (callback) => ipcRenderer.on("menu-new-chat", callback),
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),
})

// Expose environment variables
contextBridge.exposeInMainWorld("nodeEnv", {
  isDev: process.env.NODE_ENV === "development",
})

// Intercept fetch to add Electron-specific headers
const originalFetch = globalThis.fetch
globalThis.fetch = function(...args) {
  const [url, options = {}] = args

  // Add header to identify Electron requests
  const modifiedOptions = {
    ...options,
    headers: {
      ...options.headers,
      'X-Electron-App': 'true',
    },
  }

  return originalFetch(url, modifiedOptions)
}
