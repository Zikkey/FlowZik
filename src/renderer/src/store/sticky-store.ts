import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { electronStoreStorage } from './storage-adapter'
import { createId } from '@/lib/id'
import type { StickyNote } from '@/types'

const STICKY_COLORS = ['#fef08a', '#fda4af', '#93c5fd', '#86efac', '#c4b5fd', '#fdba74']

interface StickyState {
  stickyNotes: Record<string, StickyNote>

  createStickyNote: (boardId: string, x: number, y: number, text?: string) => string
  updateStickyNote: (id: string, updates: Partial<Pick<StickyNote, 'text' | 'color' | 'x' | 'y' | 'width' | 'height'>>) => void
  deleteStickyNote: (id: string) => void
  getStickyNotesForBoard: (boardId: string) => StickyNote[]
}

export const useStickyStore = create<StickyState>()(
  persist(
    (set, get) => ({
      stickyNotes: {},

      createStickyNote: (boardId, x, y, text = '') => {
        const id = createId()
        const color = STICKY_COLORS[Math.floor(Math.random() * STICKY_COLORS.length)]
        set((state) => ({
          stickyNotes: {
            ...state.stickyNotes,
            [id]: {
              id,
              boardId,
              text,
              color,
              x,
              y,
              width: 180,
              height: 140,
              createdAt: new Date().toISOString()
            }
          }
        }))
        return id
      },

      updateStickyNote: (id, updates) => {
        set((state) => {
          const note = state.stickyNotes[id]
          if (!note) return state
          return {
            stickyNotes: {
              ...state.stickyNotes,
              [id]: { ...note, ...updates }
            }
          }
        })
      },

      deleteStickyNote: (id) => {
        set((state) => {
          const { [id]: _, ...rest } = state.stickyNotes
          return { stickyNotes: rest }
        })
      },

      getStickyNotesForBoard: (boardId) => {
        return Object.values(get().stickyNotes).filter((n) => n.boardId === boardId)
      }
    }),
    {
      name: 'flowzik-sticky-notes',
      storage: createJSONStorage(() => electronStoreStorage)
    }
  )
)
