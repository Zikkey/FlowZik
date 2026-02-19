import { create } from 'zustand'

interface SelectionState {
  selectedCardIds: Set<string>
  clipboardCardIds: string[]
  hoveredColumnId: string | null
  isSelecting: boolean
  toggleCardSelection: (cardId: string) => void
  addToSelection: (cardId: string) => void
  removeFromSelection: (cardId: string) => void
  setSelection: (ids: string[]) => void
  clearSelection: () => void
  setIsSelecting: (v: boolean) => void
  copySelectedCards: () => void
  setHoveredColumnId: (id: string | null) => void
}

export const useSelectionStore = create<SelectionState>((set, get) => ({
  selectedCardIds: new Set(),
  clipboardCardIds: [],
  hoveredColumnId: null,
  isSelecting: false,

  toggleCardSelection: (cardId) =>
    set((state) => {
      const next = new Set(state.selectedCardIds)
      if (next.has(cardId)) next.delete(cardId)
      else next.add(cardId)
      return { selectedCardIds: next }
    }),

  addToSelection: (cardId) =>
    set((state) => {
      const next = new Set(state.selectedCardIds)
      next.add(cardId)
      return { selectedCardIds: next }
    }),

  removeFromSelection: (cardId) =>
    set((state) => {
      const next = new Set(state.selectedCardIds)
      next.delete(cardId)
      return { selectedCardIds: next }
    }),

  setSelection: (ids) =>
    set({ selectedCardIds: new Set(ids) }),

  clearSelection: () =>
    set({ selectedCardIds: new Set(), isSelecting: false }),

  setIsSelecting: (v) =>
    set({ isSelecting: v }),

  copySelectedCards: () => {
    const { selectedCardIds } = get()
    set({ clipboardCardIds: Array.from(selectedCardIds) })
  },

  setHoveredColumnId: (id) =>
    set({ hoveredColumnId: id })
}))
