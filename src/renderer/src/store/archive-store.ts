import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { electronStoreStorage } from './storage-adapter'
import type { ArchivedCard, ArchivedColumn, Card, Column } from '@/types'

interface ArchiveState {
  archivedCards: Record<string, ArchivedCard>
  archivedColumns: Record<string, ArchivedColumn>

  archiveCard: (card: Card, columnTitle: string) => void
  restoreCard: (id: string) => ArchivedCard | null
  deleteArchivedCard: (id: string) => void

  archiveColumn: (column: Column, cards: Card[]) => void
  restoreColumn: (id: string) => ArchivedColumn | null
  deleteArchivedColumn: (id: string) => void
}

export const useArchiveStore = create<ArchiveState>()(
  persist(
    (set, get) => ({
      archivedCards: {},
      archivedColumns: {},

      archiveCard: (card, columnTitle) => {
        const archived: ArchivedCard = {
          ...card,
          archivedAt: new Date().toISOString(),
          originalColumnId: card.columnId,
          originalColumnTitle: columnTitle
        }
        set((state) => ({
          archivedCards: { ...state.archivedCards, [card.id]: archived }
        }))
      },

      restoreCard: (id) => {
        const card = get().archivedCards[id]
        if (!card) return null
        set((state) => {
          const newArchived = { ...state.archivedCards }
          delete newArchived[id]
          return { archivedCards: newArchived }
        })
        return card
      },

      deleteArchivedCard: (id) => {
        set((state) => {
          const newArchived = { ...state.archivedCards }
          delete newArchived[id]
          return { archivedCards: newArchived }
        })
      },

      archiveColumn: (column, cards) => {
        const archived: ArchivedColumn = {
          ...column,
          archivedAt: new Date().toISOString(),
          cards
        }
        set((state) => ({
          archivedColumns: { ...state.archivedColumns, [column.id]: archived }
        }))
      },

      restoreColumn: (id) => {
        const col = get().archivedColumns[id]
        if (!col) return null
        set((state) => {
          const newArchived = { ...state.archivedColumns }
          delete newArchived[id]
          return { archivedColumns: newArchived }
        })
        return col
      },

      deleteArchivedColumn: (id) => {
        set((state) => {
          const newArchived = { ...state.archivedColumns }
          delete newArchived[id]
          return { archivedColumns: newArchived }
        })
      }
    }),
    {
      name: 'flowzik-archive-data',
      storage: createJSONStorage(() => electronStoreStorage),
      partialize: (state) => ({
        archivedCards: state.archivedCards,
        archivedColumns: state.archivedColumns
      })
    }
  )
)
