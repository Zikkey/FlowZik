import { useEffect } from 'react'
import { useBoardStore } from '@/store/board-store'
import { dropPendingWrites } from '@/store/storage-adapter'

/**
 * Listens for 'store:external-update' from main process (triggered by HTTP API)
 * and rehydrates the Zustand board store so the UI reflects API changes in real-time.
 */
export function useExternalStoreSync(): void {
  useEffect(() => {
    const cleanup = window.electronAPI.onExternalStoreUpdate(async () => {
      // Drop any stale debounced Zustand writes so they don't overwrite API data
      dropPendingWrites()
      // Re-read persisted data from main process and merge into Zustand
      const raw = await window.electronAPI.storeGet('flowzik-board-data')
      if (!raw || typeof raw !== 'string') return
      try {
        const parsed = JSON.parse(raw)
        const state = parsed.state ?? parsed
        if (state.boards && state.columns && state.cards) {
          useBoardStore.setState({
            boards: state.boards,
            columns: state.columns,
            cards: state.cards,
            boardOrder: state.boardOrder ?? [],
            globalLabels: state.globalLabels ?? []
          })
        }
      } catch {
        // Ignore parse errors
      }
    })
    return cleanup
  }, [])
}
