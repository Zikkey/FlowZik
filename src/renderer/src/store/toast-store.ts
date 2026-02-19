import { create } from 'zustand'

export interface Toast {
  id: string
  message: string
  type: 'success' | 'info' | 'warning' | 'error'
  duration: number
  cardId?: string
  boardId?: string
  actionLabel?: string
  onAction?: () => void
  createdAt: number
}

interface ToastState {
  toasts: Toast[]
  pausedIds: Set<string>
  addToast: (message: string, type?: Toast['type'], duration?: number, opts?: { cardId?: string; boardId?: string; actionLabel?: string; onAction?: () => void }) => void
  removeToast: (id: string) => void
  pauseToast: (id: string) => void
  resumeToast: (id: string) => void
}

let toastCounter = 0

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  pausedIds: new Set(),
  addToast: (message, type = 'info', duration = 3500, opts) => {
    const id = `toast-${++toastCounter}`
    const toast: Toast = { id, message, type, duration, createdAt: Date.now(), ...opts }
    set((state) => ({ toasts: [...state.toasts.slice(-9), toast] }))

    const scheduleRemoval = () => {
      const check = () => {
        if (get().pausedIds.has(id)) {
          setTimeout(check, 200)
          return
        }
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
          pausedIds: (() => { const s = new Set(state.pausedIds); s.delete(id); return s })()
        }))
      }
      setTimeout(check, duration)
    }
    scheduleRemoval()
  },
  removeToast: (id) => set((state) => ({
    toasts: state.toasts.filter((t) => t.id !== id),
    pausedIds: (() => { const s = new Set(state.pausedIds); s.delete(id); return s })()
  })),
  pauseToast: (id) => set((state) => ({ pausedIds: new Set(state.pausedIds).add(id) })),
  resumeToast: (id) => set((state) => {
    const s = new Set(state.pausedIds)
    s.delete(id)
    return { pausedIds: s }
  })
}))
