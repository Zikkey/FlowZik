import type { StateStorage } from 'zustand/middleware'

// ── Debounced write buffer ──────────────────────────
// Groups rapid state changes into a single IPC write per key.
// Without this, every Zustand state change triggers a synchronous
// file write in the main process — slow and wasteful during drag-drop, etc.
const pendingWrites = new Map<string, string>()
let flushTimer: ReturnType<typeof setTimeout> | null = null
const DEBOUNCE_MS = 500

function scheduleSave(): void {
  if (flushTimer) clearTimeout(flushTimer)
  flushTimer = setTimeout(flushPending, DEBOUNCE_MS)
}

function flushPending(): void {
  if (flushTimer) { clearTimeout(flushTimer); flushTimer = null }
  const entries = [...pendingWrites.entries()]
  pendingWrites.clear()
  for (const [name, value] of entries) {
    window.electronAPI.storeSet(name, value)
  }
}

// Flush on page unload (normal close) and on visibility change (minimize/tab)
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', flushPending)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flushPending()
  })
  // Periodic safety flush every 15s — protects against crash/force-kill
  // At worst, user loses 15s of work instead of everything since last manual save
  setInterval(() => {
    if (pendingWrites.size > 0) flushPending()
  }, 15_000)
}

export const electronStoreStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    const value = await window.electronAPI.storeGet(name)
    return typeof value === 'string' ? value : null
  },
  setItem: async (name: string, value: string): Promise<void> => {
    pendingWrites.set(name, value)
    scheduleSave()
  },
  removeItem: async (name: string): Promise<void> => {
    pendingWrites.delete(name)
    await window.electronAPI.storeDelete(name)
  }
}
