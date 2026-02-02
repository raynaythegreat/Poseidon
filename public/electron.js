const { app, BrowserWindow, Menu, shell, ipcMain, dialog, session } = require("electron")
const path = require("path")

// Detect development mode - FIXED: avoid regex literal that breaks asar packaging
const isDev = process.env.NODE_ENV === 'development' ||
               process.env.ELECTRON_IS_DEV === 'true' ||
               !app.isPackaged ||
               process.defaultApp ||
               process.execPath.includes('node_modules' + path.sep + 'electron')

let nextServer = null

// Helper function to kill any process using port 1998
function killPort1998() {
  try {
    const { execFileSync } = require('child_process')
    // Try to find and kill processes using port 1998
    try {
      execFileSync('fuser', ['-k', '1998/tcp'], { stdio: 'ignore' })
      console.log('Killed process on port 1998')
    } catch (e) {
      // fuser might not be available or no process on port
    }

    // Alternative method using lsof
    try {
      const result = execFileSync('lsof', ['-ti', ':1998'], { encoding: 'utf-8' })
      const pids = result.trim().split('\n').filter(Boolean)
      for (const pid of pids) {
        try {
          process.kill(pid, 'SIGKILL')
          console.log(`Killed PID ${pid} using port 1998`)
        } catch (e) {
          // Process might already be dead
        }
      }
    } catch (e) {
      // lsof might not be available or no process on port
    }

    // Wait a moment for port to be released
    return new Promise(resolve => setTimeout(resolve, 500))
  } catch (error) {
    console.error('Error killing port 1998:', error)
  }
}

// Helper function to check if server is ready
async function waitForServer() {
  const http = require('http')
  const maxAttempts = 30 // 30 attempts = 15 seconds
  let attempts = 0

  while (attempts < maxAttempts) {
    try {
      await new Promise((resolve, reject) => {
        const req = http.get('http://localhost:1998', (res) => {
          resolve(true)
        })
        req.on('error', reject)
        req.setTimeout(1000, () => {
          req.destroy()
          reject(new Error('timeout'))
        })
      })
      console.log('Server is ready!')
      return true
    } catch (e) {
      attempts++
      if (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }
  }
  throw new Error('Server failed to start after 15 seconds')
}

// Start Next.js server in production mode
async function startNextServer() {
  if (isDev) return // Don't start server in dev mode (user runs npm run electron-dev)

  try {
    const { spawn } = require('child_process')
    const { execFileSync } = require('child_process')
    const fs = require('fs')

    // First, kill any existing process on port 1998
    await killPort1998()

    // Find node executable
    let nodeExec = null
    try {
      nodeExec = execFileSync('which', ['node'], { encoding: 'utf-8' }).trim()
    } catch (e) {
      const commonPaths = [
        '/usr/local/bin/node',
        '/opt/homebrew/bin/node',
        '/homebrew/bin/node',
        '/usr/bin/node'
      ]
      for (const p of commonPaths) {
        if (fs.existsSync(p)) {
          nodeExec = p
          break
        }
      }
    }

    if (!nodeExec) {
      throw new Error('Could not find Node.js executable')
    }

    console.log('Found node at:', nodeExec)

    // Use the app directory (not asar when asar is disabled)
    const appPath = path.join(__dirname, '..')
    console.log('App path:', appPath)

    console.log('Starting Next.js server...')

    nextServer = spawn(nodeExec, ['server.js'], {
      cwd: appPath,
      env: { ...process.env, NODE_ENV: 'production', PORT: '1998' },
      stdio: ['ignore', 'pipe', 'pipe']
    })

    nextServer.stdout.on('data', (data) => {
      console.log(`Next.js: ${data}`)
    })

    nextServer.stderr.on('data', (data) => {
      console.error(`Next.js error: ${data}`)
    })

    nextServer.on('error', (err) => {
      console.error('Failed to start Next.js server:', err)
    })

    // Wait for server to actually be ready by polling it
    console.log('Waiting for server to be ready...')
    await waitForServer()
  } catch (error) {
    console.error('Error starting Next.js server:', error)
    throw error
  }
}

// Helper function to recursively copy directories
function copyDirectorySync(src, dest) {
  const fs = require('fs')
  const path = require('path')

  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true })
  }

  const entries = fs.readdirSync(src, { withFileTypes: true })

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name)
    const destPath = path.join(dest, entry.name)

    if (entry.isDirectory()) {
      copyDirectorySync(srcPath, destPath)
    } else {
      fs.copyFileSync(srcPath, destPath)
    }
  }
}

// Stop Next.js server when app quits
function stopNextServer() {
  if (nextServer) {
    nextServer.kill()
    nextServer = null
  }
}

// Handle EPIPE errors when launched from desktop icon (no console attached)
const safeWrite = (stream, data) => {
  try {
    if (stream && !stream.destroyed) {
      stream.write(data)
    }
  } catch (err) {
    // Ignore EPIPE and other write errors when launched from GUI
  }
}

// Override console methods to safely handle EPIPE
const originalConsoleError = console.error
const originalConsoleWarn = console.warn
const originalConsoleLog = console.log

console.error = (...args) => {
  try {
    originalConsoleError(...args)
  } catch (e) {
    // Ignore EPIPE errors
  }
}

console.warn = (...args) => {
  try {
    originalConsoleWarn(...args)
  } catch (e) {
    // Ignore EPIPE errors
  }
}

console.log = (...args) => {
  try {
    originalConsoleLog(...args)
  } catch (e) {
    // Ignore EPIPE errors
  }
}

// Handle EPIPE on stdout/stderr
if (process.stdout) {
  process.stdout.on('error', (err) => {
    if (err.code !== 'EPIPE') {
      safeWrite(process.stderr, `stdout error: ${err.message}\n`)
    }
  })
}

if (process.stderr) {
  process.stderr.on('error', (err) => {
    // Silently ignore all stderr errors
  })
}

// Keep a global reference of the window object
let mainWindow

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, "preload.js"),
    },
    icon: path.join(__dirname, "../build/icon.png"),
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "default",
    show: false, // Don't show until ready-to-show
  })

  // Load the app - always use localhost:1998 (bundled server in production, dev server in development)
  const startUrl = "http://localhost:1998"

  // Load the URL
  mainWindow.loadURL(startUrl)

  // Track if window has been shown
  let windowShown = false

  const showWindow = () => {
    if (!windowShown && mainWindow && !mainWindow.isDestroyed()) {
      windowShown = true
      mainWindow.show()

      // Always open DevTools in production for debugging
      // User can close it with F12
      mainWindow.webContents.openDevTools()
    }
  }

  // Show window when ready to prevent visual flash
  mainWindow.once("ready-to-show", showWindow)

  // Safety timeout: show window after 2 seconds even if ready-to-show doesn't fire
  // This prevents the window from never appearing if the page has loading issues
  setTimeout(() => {
    showWindow()
  }, 2000)

  // Handle window closed
  mainWindow.on("closed", () => {
    mainWindow = null
  })

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: "deny" }
  })

  // Set up application menu
  createMenu()
}

function createMenu() {
  const template = [
    {
      label: "File",
      submenu: [
        {
          label: "New Chat",
          accelerator: "CmdOrCtrl+N",
          click: () => {
            mainWindow.webContents.send("menu-new-chat")
          },
        },
        { type: "separator" },
        {
          label: "Quit",
          accelerator: process.platform === "darwin" ? "Cmd+Q" : "Ctrl+Q",
          click: () => {
            app.quit()
          },
        },
      ],
    },
    {
      label: "Edit",
      submenu: [
        { label: "Undo", accelerator: "CmdOrCtrl+Z", role: "undo" },
        { label: "Redo", accelerator: "Shift+CmdOrCtrl+Z", role: "redo" },
        { type: "separator" },
        { label: "Cut", accelerator: "CmdOrCtrl+X", role: "cut" },
        { label: "Copy", accelerator: "CmdOrCtrl+C", role: "copy" },
        { label: "Paste", accelerator: "CmdOrCtrl+V", role: "paste" },
        { label: "Select All", accelerator: "CmdOrCtrl+A", role: "selectall" },
      ],
    },
    {
      label: "View",
      submenu: [
        { label: "Reload", accelerator: "CmdOrCtrl+R", role: "reload" },
        { label: "Force Reload", accelerator: "CmdOrCtrl+Shift+R", role: "forceReload" },
        { label: "Toggle Developer Tools", accelerator: "F12", role: "toggleDevTools" },
        { type: "separator" },
        { label: "Actual Size", accelerator: "CmdOrCtrl+0", role: "resetZoom" },
        { label: "Zoom In", accelerator: "CmdOrCtrl+Plus", role: "zoomIn" },
        { label: "Zoom Out", accelerator: "CmdOrCtrl+-", role: "zoomOut" },
        { type: "separator" },
        { label: "Toggle Fullscreen", accelerator: "F11", role: "togglefullscreen" },
      ],
    },
    {
      label: "Window",
      submenu: [
        { label: "Minimize", accelerator: "CmdOrCtrl+M", role: "minimize" },
        { label: "Close", accelerator: "CmdOrCtrl+W", role: "close" },
      ],
    },
    {
      label: "Help",
      submenu: [
        {
          label: "About Poseidon",
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: "info",
              title: "About Poseidon",
              message: "Poseidon",
              detail:
                "AI-powered web development command center\nVersion 1.0.0\n\nA cyber-styled AI command center for planning, building, and deploying web applications with confidence.",
              buttons: ["OK"],
            })
          },
        },
      ],
    },
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

// App event handlers
app.whenReady().then(async () => {
  // Suppress Electron CSP warning (we need 'unsafe-inline' and 'unsafe-eval' for React/Next.js)
  process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true'

  // Add X-Electron-App header to all requests for SSR detection
  session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
    callback({
      requestHeaders: {
        ...details.requestHeaders,
        'X-Electron-App': 'true',
      }
    })
  })

  // Set CSP for all windows
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob:;",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob:;",
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;",
          "font-src 'self' https://fonts.gstatic.com;",
          "img-src 'self' data: blob: https: http:;",
          "connect-src 'self' https: http: ws://localhost:* ws://127.0.0.1:* ws://0.0.0.0:*;",
          "worker-src 'self' blob:;",
          "frame-src 'self' blob: data:;",
          "object-src 'self' blob: data:;",
          "base-uri 'self';",
          "form-action 'self';"
        ].join(' ')
      }
    })
  })

  // Start Next.js bundled server in production
  if (!isDev) {
    await startNextServer()
  }

  createWindow()
})

app.on("window-all-closed", () => {
  // Stop Next.js server when all windows are closed
  stopNextServer()

  if (process.platform !== "darwin") {
    app.quit()
  }
})

// Also stop server when app quits (for macOS)
app.on('before-quit', () => {
  stopNextServer()
})

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

// Security: Prevent new window creation
app.on("web-contents-created", (event, contents) => {
  contents.on("new-window", (event, navigationUrl) => {
    event.preventDefault()
    shell.openExternal(navigationUrl)
  })
})

// Handle app protocol for file:// URLs
app.setAsDefaultProtocolClient("poseidon")

// IPC handlers
ipcMain.handle("app-version", () => {
  return app.getVersion()
})

ipcMain.handle("platform", () => {
  return process.platform
})
