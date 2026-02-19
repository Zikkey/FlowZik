import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { electronStoreStorage } from './storage-adapter'
import { createId } from '@/lib/id'

export interface Note {
  id: string
  title: string
  content: string
  createdAt: string
  updatedAt: string
}

interface NotesState {
  // Legacy compat
  content: string
  setContent: (content: string) => void
  // Multi-note support
  notes: Note[]
  activeNoteId: string | null
  addNote: (title?: string) => string
  deleteNote: (id: string) => void
  setActiveNote: (id: string) => void
  updateNote: (id: string, updates: Partial<Pick<Note, 'title' | 'content'>>) => void
}

export const useNotesStore = create<NotesState>()(
  persist(
    (set, get) => ({
      content: '',
      setContent: (content) => {
        // Update legacy field + active note
        const { activeNoteId, notes } = get()
        if (activeNoteId) {
          set({
            content,
            notes: notes.map((n) => n.id === activeNoteId ? { ...n, content, updatedAt: new Date().toISOString() } : n)
          })
        } else {
          set({ content })
        }
      },
      notes: [],
      activeNoteId: null,
      addNote: (title) => {
        const id = `note-${createId()}`
        const now = new Date().toISOString()
        const note: Note = { id, title: title ?? '', content: '', createdAt: now, updatedAt: now }
        set((state) => ({
          notes: [...state.notes, note],
          activeNoteId: id,
          content: ''
        }))
        return id
      },
      deleteNote: (id) => set((state) => {
        const remaining = state.notes.filter((n) => n.id !== id)
        const newActive = state.activeNoteId === id
          ? (remaining.length > 0 ? remaining[remaining.length - 1].id : null)
          : state.activeNoteId
        return {
          notes: remaining,
          activeNoteId: newActive,
          content: newActive ? remaining.find((n) => n.id === newActive)?.content ?? '' : ''
        }
      }),
      setActiveNote: (id) => set((state) => {
        const note = state.notes.find((n) => n.id === id)
        return { activeNoteId: id, content: note?.content ?? '' }
      }),
      updateNote: (id, updates) => set((state) => ({
        notes: state.notes.map((n) => n.id === id ? { ...n, ...updates, updatedAt: new Date().toISOString() } : n),
        content: state.activeNoteId === id && updates.content !== undefined ? updates.content : state.content
      }))
    }),
    {
      name: 'flowzik-quick-notes',
      storage: createJSONStorage(() => electronStoreStorage),
      partialize: (state: any) => ({
        content: state.content,
        notes: state.notes,
        activeNoteId: state.activeNoteId
      })
    }
  )
)
