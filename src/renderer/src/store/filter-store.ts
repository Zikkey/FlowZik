import { create } from 'zustand'
import type { Priority } from '@/types'

interface FilterState {
  searchQuery: string
  labelIds: string[]
  priorities: Priority[]
  showOverdueOnly: boolean

  setSearchQuery: (query: string) => void
  toggleLabelFilter: (labelId: string) => void
  togglePriorityFilter: (priority: Priority) => void
  toggleOverdueOnly: () => void
  clearAllFilters: () => void
  hasActiveFilters: () => boolean
}

export const useFilterStore = create<FilterState>()((set, get) => ({
  searchQuery: '',
  labelIds: [],
  priorities: [],
  showOverdueOnly: false,

  setSearchQuery: (query) => set({ searchQuery: query }),

  toggleLabelFilter: (labelId) =>
    set((state) => ({
      labelIds: state.labelIds.includes(labelId)
        ? state.labelIds.filter((id) => id !== labelId)
        : [...state.labelIds, labelId]
    })),

  togglePriorityFilter: (priority) =>
    set((state) => ({
      priorities: state.priorities.includes(priority)
        ? state.priorities.filter((p) => p !== priority)
        : [...state.priorities, priority]
    })),

  toggleOverdueOnly: () => set((state) => ({ showOverdueOnly: !state.showOverdueOnly })),

  clearAllFilters: () =>
    set({ searchQuery: '', labelIds: [], priorities: [], showOverdueOnly: false }),

  hasActiveFilters: () => {
    const s = get()
    return s.searchQuery !== '' || s.labelIds.length > 0 || s.priorities.length > 0 || s.showOverdueOnly
  }
}))
