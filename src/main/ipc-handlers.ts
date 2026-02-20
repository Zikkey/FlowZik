import { ipcMain, BrowserWindow, dialog, app, shell, Notification } from 'electron'
import { readFile, writeFile, mkdir, copyFile, unlink } from 'fs/promises'
import { existsSync, readFileSync, writeFileSync, mkdirSync, renameSync } from 'fs'
import { join, extname, dirname, basename, normalize } from 'path'

// Simple JSON file store with atomic writes and backup
class JsonStore {
  private filePath: string
  private backupPath: string
  private tempPath: string
  private data: Record<string, unknown> = {}

  constructor(name: string) {
    const userDataPath = app.getPath('userData')
    this.filePath = join(userDataPath, `${name}.json`)
    this.backupPath = join(userDataPath, `${name}.backup.json`)
    this.tempPath = join(userDataPath, `${name}.tmp.json`)
    this.load()
  }

  private load(): void {
    // Try main file first, then backup
    for (const path of [this.filePath, this.backupPath]) {
      try {
        if (existsSync(path)) {
          const raw = readFileSync(path, 'utf-8')
          const parsed = JSON.parse(raw)
          if (parsed && typeof parsed === 'object') {
            this.data = parsed
            return
          }
        }
      } catch {
        // Try next file
      }
    }
    this.data = {}
  }

  private save(): void {
    try {
      const dir = dirname(this.filePath)
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true })
      }
      const json = JSON.stringify(this.data)
      // Atomic write: write to temp, then rename
      writeFileSync(this.tempPath, json, 'utf-8')
      // Backup current file before overwrite
      if (existsSync(this.filePath)) {
        try { renameSync(this.filePath, this.backupPath) } catch { /* ok */ }
      }
      renameSync(this.tempPath, this.filePath)
    } catch (err) {
      console.error('Failed to save store:', err)
    }
  }

  get(key: string): unknown {
    return this.data[key] ?? null
  }

  set(key: string, value: unknown): void {
    this.data[key] = value
    this.save()
  }

  delete(key: string): void {
    delete this.data[key]
    this.save()
  }
}

let store: JsonStore

export function getStore(): JsonStore {
  return store
}

export function registerIpcHandlers(): void {
  store = new JsonStore('flowzik-data')

  ipcMain.handle('store:get', (_event, key: string) => {
    return store.get(key)
  })

  ipcMain.handle('store:set', (_event, key: string, value: unknown) => {
    store.set(key, value)
  })

  ipcMain.handle('store:delete', (_event, key: string) => {
    store.delete(key)
  })

  ipcMain.on('window:minimize', (event) => {
    BrowserWindow.fromWebContents(event.sender)?.minimize()
  })

  ipcMain.on('window:maximize', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (win?.isMaximized()) {
      win.unmaximize()
    } else {
      win?.maximize()
    }
  })

  ipcMain.on('window:close', (event) => {
    BrowserWindow.fromWebContents(event.sender)?.close()
  })

  ipcMain.handle('window:isMaximized', (event) => {
    return BrowserWindow.fromWebContents(event.sender)?.isMaximized() ?? false
  })

  ipcMain.handle('dialog:save', async (event, defaultName: string) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (!win) return undefined
    const result = await dialog.showSaveDialog(win, {
      defaultPath: defaultName,
      filters: [
        { name: 'JSON', extensions: ['json'] },
        { name: 'CSV', extensions: ['csv'] }
      ]
    })
    return result.filePath
  })

  ipcMain.handle('dialog:open', async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (!win) return undefined
    const result = await dialog.showOpenDialog(win, {
      filters: [{ name: 'JSON', extensions: ['json'] }],
      properties: ['openFile']
    })
    return result.filePaths[0]
  })

  ipcMain.handle('file:write', async (_event, filePath: string, content: string) => {
    await writeFile(filePath, content, 'utf-8')
  })

  ipcMain.handle('file:read', async (_event, filePath: string) => {
    return await readFile(filePath, 'utf-8')
  })

  // Attachment handlers
  const attachmentsDir = join(app.getPath('userData'), 'attachments')

  ipcMain.handle('attachments:copy', async (_event, sourcePath: string, destFileName: string) => {
    if (!existsSync(attachmentsDir)) {
      await mkdir(attachmentsDir, { recursive: true })
    }
    // Sanitize filename to prevent path traversal (../etc)
    const safeName = basename(destFileName)
    const destPath = join(attachmentsDir, safeName)
    await copyFile(sourcePath, destPath)
    return destPath
  })

  ipcMain.handle('attachments:saveBuffer', async (_event, name: string, buffer: Uint8Array | Buffer) => {
    if (!existsSync(attachmentsDir)) {
      await mkdir(attachmentsDir, { recursive: true })
    }
    // Sanitize filename to prevent path traversal
    const safeName = `${Date.now()}-${basename(name)}`
    const destPath = join(attachmentsDir, safeName)
    await writeFile(destPath, buffer)
    return destPath
  })

  ipcMain.handle('attachments:delete', async (_event, filePath: string) => {
    try {
      const normalizedPath = normalize(filePath)
      if (!normalizedPath.startsWith(attachmentsDir)) return
      if (existsSync(normalizedPath)) {
        await unlink(normalizedPath)
      }
    } catch { /* ignore */ }
  })

  ipcMain.handle('dialog:openAttachment', async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (!win) return []
    const result = await dialog.showOpenDialog(win, {
      properties: ['openFile', 'multiSelections'],
      filters: [
        { name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    })
    return result.filePaths
  })

  ipcMain.handle('file:readAsDataUrl', async (_event, filePath: string) => {
    const ext = extname(filePath).toLowerCase().slice(1)
    const mimeMap: Record<string, string> = {
      png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg',
      gif: 'image/gif', webp: 'image/webp', svg: 'image/svg+xml', bmp: 'image/bmp'
    }
    const buffer = await readFile(filePath)
    const base64 = buffer.toString('base64')
    const mimeType = mimeMap[ext] || 'application/octet-stream'
    return `data:${mimeType};base64,${base64}`
  })

  ipcMain.handle('shell:openPath', async (_event, filePath: string) => {
    const normalizedPath = normalize(filePath)
    if (!normalizedPath.startsWith(attachmentsDir)) return
    await shell.openPath(normalizedPath)
  })

  ipcMain.handle('set-zoom-factor', (event, factor: number) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (win) win.webContents.setZoomFactor(factor)
  })

  ipcMain.handle('export:pdf', async (event, html: string) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (!win) return false
    const result = await dialog.showSaveDialog(win, {
      defaultPath: 'board-export.pdf',
      filters: [{ name: 'PDF', extensions: ['pdf'] }]
    })
    if (!result.filePath) return false

    const hiddenWin = new BrowserWindow({
      width: 1200,
      height: 800,
      show: false,
      webPreferences: { offscreen: true, sandbox: true, contextIsolation: true, nodeIntegration: false }
    })
    try {
      await hiddenWin.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`)
      await new Promise((r) => setTimeout(r, 500))
      const pdfBuffer = await hiddenWin.webContents.printToPDF({
        landscape: true,
        printBackground: true,
        margins: { top: 0.4, bottom: 0.4, left: 0.4, right: 0.4 }
      })
      await writeFile(result.filePath, pdfBuffer)
      return true
    } finally {
      hiddenWin.close()
    }
  })

  ipcMain.handle('export:image', async (event, html: string) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (!win) return null
    const result = await dialog.showSaveDialog(win, {
      defaultPath: 'board-export.png',
      filters: [{ name: 'PNG Image', extensions: ['png'] }]
    })
    if (!result.filePath) return null

    const hiddenWin = new BrowserWindow({
      width: 1400,
      height: 900,
      show: false,
      webPreferences: { offscreen: true, sandbox: true, contextIsolation: true, nodeIntegration: false }
    })
    try {
      await hiddenWin.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`)
      await new Promise((r) => setTimeout(r, 600))

      const contentSize = await hiddenWin.webContents.executeJavaScript(
        `JSON.stringify({ w: document.body.scrollWidth, h: document.body.scrollHeight })`
      )
      const { w, h } = JSON.parse(contentSize)
      hiddenWin.setSize(Math.min(w + 40, 3000), Math.min(h + 40, 2000))
      await new Promise((r) => setTimeout(r, 300))

      const image = await hiddenWin.webContents.capturePage()
      await writeFile(result.filePath, image.toPNG())
      return result.filePath
    } finally {
      hiddenWin.close()
    }
  })

  ipcMain.handle('shell:showItemInFolder', (_event, filePath: string) => {
    const normalizedPath = normalize(filePath)
    if (!normalizedPath.startsWith(attachmentsDir)) return
    shell.showItemInFolder(normalizedPath)
  })

  ipcMain.on('notification:show', (_event, title: string, body: string) => {
    if (Notification.isSupported()) {
      new Notification({ title, body }).show()
    }
  })
}
