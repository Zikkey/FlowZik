import { contextBridge, ipcRenderer } from 'electron'

const electronAPI = {
  storeGet: (key: string): Promise<unknown> => ipcRenderer.invoke('store:get', key),
  storeSet: (key: string, value: unknown): Promise<void> => ipcRenderer.invoke('store:set', key, value),
  storeDelete: (key: string): Promise<void> => ipcRenderer.invoke('store:delete', key),

  minimizeWindow: (): void => { ipcRenderer.send('window:minimize') },
  maximizeWindow: (): void => { ipcRenderer.send('window:maximize') },
  closeWindow: (): void => { ipcRenderer.send('window:close') },
  isMaximized: (): Promise<boolean> => ipcRenderer.invoke('window:isMaximized'),

  onMaximizeChange: (callback: (isMaximized: boolean) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, value: boolean): void => { callback(value) }
    ipcRenderer.on('window:maximize-change', handler)
    return () => { ipcRenderer.removeListener('window:maximize-change', handler) }
  },

  saveFileDialog: (defaultName: string): Promise<string | undefined> =>
    ipcRenderer.invoke('dialog:save', defaultName),
  openFileDialog: (): Promise<string | undefined> =>
    ipcRenderer.invoke('dialog:open'),
  writeFile: (path: string, content: string): Promise<void> =>
    ipcRenderer.invoke('file:write', path, content),
  readFile: (path: string): Promise<string> =>
    ipcRenderer.invoke('file:read', path),

  copyAttachment: (sourcePath: string, destFileName: string): Promise<string> =>
    ipcRenderer.invoke('attachments:copy', sourcePath, destFileName),
  saveDroppedFile: (name: string, buffer: ArrayBuffer): Promise<string> =>
    ipcRenderer.invoke('attachments:saveBuffer', name, new Uint8Array(buffer)),
  deleteAttachment: (filePath: string): Promise<void> =>
    ipcRenderer.invoke('attachments:delete', filePath),
  openAttachmentDialog: (): Promise<string[]> =>
    ipcRenderer.invoke('dialog:openAttachment'),
  readFileAsDataUrl: (filePath: string): Promise<string> =>
    ipcRenderer.invoke('file:readAsDataUrl', filePath),
  openPath: (filePath: string): Promise<void> =>
    ipcRenderer.invoke('shell:openPath', filePath),

  setZoomFactor: (factor: number): Promise<void> =>
    ipcRenderer.invoke('set-zoom-factor', factor),

  exportPdf: (html: string): Promise<boolean> =>
    ipcRenderer.invoke('export:pdf', html),

  exportImage: (html: string): Promise<string | null> =>
    ipcRenderer.invoke('export:image', html),

  showItemInFolder: (filePath: string): Promise<void> =>
    ipcRenderer.invoke('shell:showItemInFolder', filePath),

  showNotification: (title: string, body: string): void => {
    ipcRenderer.send('notification:show', title, body)
  }
}

contextBridge.exposeInMainWorld('electronAPI', electronAPI)
