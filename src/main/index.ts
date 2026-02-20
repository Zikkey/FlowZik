import { app, BrowserWindow, shell, ipcMain } from 'electron'
import { join } from 'path'
import { registerIpcHandlers, getStore } from './ipc-handlers'
import { startApiServer, stopApiServer, isApiServerRunning } from './api-server'

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    show: false,
    frame: false,
    titleBarStyle: 'hidden',
    backgroundColor: '#111115',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.maximize()
    mainWindow.show()
  })

  // Notify renderer about maximize/unmaximize changes
  mainWindow.on('maximize', () => mainWindow.webContents.send('window:maximize-change', true))
  mainWindow.on('unmaximize', () => mainWindow.webContents.send('window:maximize-change', false))

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  app.setAppUserModelId('com.flowzik')

  registerIpcHandlers()
  createWindow()

  // API server toggle IPC
  ipcMain.handle('api:start', () => {
    const store = getStore()
    if (store) startApiServer(store)
    return isApiServerRunning()
  })
  ipcMain.handle('api:stop', () => {
    stopApiServer()
    return false
  })
  ipcMain.handle('api:status', () => isApiServerRunning())

  // Auto-start API if it was enabled previously
  const store = getStore()
  if (store && store.get('api-enabled') === true) {
    startApiServer(store)
  }

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  stopApiServer()
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
