interface ElectronAPI {
  storeGet: (key: string) => Promise<unknown>
  storeSet: (key: string, value: unknown) => Promise<void>
  storeDelete: (key: string) => Promise<void>
  minimizeWindow: () => void
  maximizeWindow: () => void
  closeWindow: () => void
  isMaximized: () => Promise<boolean>
  onMaximizeChange: (callback: (isMaximized: boolean) => void) => () => void
  saveFileDialog: (defaultName: string) => Promise<string | undefined>
  openFileDialog: () => Promise<string | undefined>
  writeFile: (path: string, content: string) => Promise<void>
  readFile: (path: string) => Promise<string>
  copyAttachment: (sourcePath: string, destFileName: string) => Promise<string>
  saveDroppedFile: (name: string, buffer: ArrayBuffer) => Promise<string>
  deleteAttachment: (filePath: string) => Promise<void>
  openAttachmentDialog: () => Promise<string[]>
  readFileAsDataUrl: (filePath: string) => Promise<string>
  openPath: (filePath: string) => Promise<void>
  setZoomFactor: (factor: number) => Promise<void>
  exportPdf: (html: string) => Promise<boolean>
  exportImage: (html: string) => Promise<string | null>
  showItemInFolder: (filePath: string) => Promise<void>
  showNotification: (title: string, body: string) => void
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}

export {}
