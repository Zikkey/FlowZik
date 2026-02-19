import { useEffect } from 'react'
import { useAppStore, useBoardStore } from '@/store'
import { useSelectionStore } from '@/hooks/use-selection'
import { useToastStore } from '@/store/toast-store'

export function useKeyboardShortcuts(): void {
  const setActiveCardId = useAppStore((s) => s.setActiveCardId)
  const setArchivePanelOpen = useAppStore((s) => s.setArchivePanelOpen)
  const activeBoardId = useAppStore((s) => s.activeBoardId)
  const setActiveBoardId = useAppStore((s) => s.setActiveBoardId)
  const setSearchPanelOpen = useAppStore((s) => s.setSearchPanelOpen)
  const setFocusedCardId = useAppStore((s) => s.setFocusedCardId)
  const setNotesOpen = useAppStore((s) => s.setNotesOpen)
  const toggleSidebar = useAppStore((s) => s.toggleSidebar)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInput = (e.target as HTMLElement).tagName === 'INPUT' ||
        (e.target as HTMLElement).tagName === 'TEXTAREA' ||
        (e.target as HTMLElement).isContentEditable

      if (e.key === 'Escape') {
        // During tutorial, let the tutorial handle Escape
        const state = useAppStore.getState()
        if (state.showOnboarding) return
        // Close the topmost panel only (priority order)
        if (state.activeCardId) { setActiveCardId(null); return }
        if (state.searchPanelOpen) { setSearchPanelOpen(false); return }
        if (state.archivePanelOpen) { setArchivePanelOpen(false); return }
        if (state.notesOpen) { setNotesOpen(false); return }
        if (state.settingsOpen) { useAppStore.getState().setSettingsOpen(false); return }
        return
      }

      // Undo / Redo — works even in inputs
      if ((e.ctrlKey || e.metaKey) && e.code === 'KeyZ' && !e.shiftKey) {
        // Don't intercept native undo inside text inputs
        if (!isInput) {
          e.preventDefault()
          ;(useBoardStore as any).temporal?.getState()?.undo()
        }
        return
      }
      if ((e.ctrlKey || e.metaKey) && e.code === 'KeyZ' && e.shiftKey) {
        if (!isInput) {
          e.preventDefault()
          ;(useBoardStore as any).temporal?.getState()?.redo()
        }
        return
      }
      if ((e.ctrlKey || e.metaKey) && e.code === 'KeyY') {
        if (!isInput) {
          e.preventDefault()
          ;(useBoardStore as any).temporal?.getState()?.redo()
        }
        return
      }

      // Ctrl+C — copy selected cards (only when not in input and have selection)
      if ((e.ctrlKey || e.metaKey) && e.code === 'KeyC' && !e.shiftKey && !isInput) {
        const sel = useSelectionStore.getState()
        if (sel.selectedCardIds.size > 0) {
          e.preventDefault()
          sel.copySelectedCards()
          useToastStore.getState().addToast(
            sel.selectedCardIds.size === 1 ? 'Card copied' : `${sel.selectedCardIds.size} cards copied`,
            'success'
          )
        }
      }

      // Ctrl+V — paste copied cards into hovered or focused column
      if ((e.ctrlKey || e.metaKey) && e.code === 'KeyV' && !e.shiftKey && !isInput) {
        const sel = useSelectionStore.getState()
        if (sel.clipboardCardIds.length > 0) {
          e.preventDefault()
          // Determine target column: hovered > focused card's column > first column
          let targetColumnId = sel.hoveredColumnId
          if (!targetColumnId) {
            const focusedId = useAppStore.getState().focusedCardId
            if (focusedId) {
              const card = useBoardStore.getState().cards[focusedId]
              if (card) targetColumnId = card.columnId
            }
          }
          if (!targetColumnId) {
            const boardId = useAppStore.getState().activeBoardId
            const board = boardId ? useBoardStore.getState().boards[boardId] : null
            if (board && board.columnOrder.length > 0) {
              targetColumnId = board.columnOrder[0]
            }
          }
          if (targetColumnId) {
            const newIds = useBoardStore.getState().pasteCardsToColumn(sel.clipboardCardIds, targetColumnId)
            if (newIds.length > 0) {
              useToastStore.getState().addToast(
                newIds.length === 1 ? 'Card pasted' : `${newIds.length} cards pasted`,
                'success'
              )
            } else {
              useToastStore.getState().addToast('Nothing to paste — source cards were deleted', 'error')
            }
          }
        }
      }

      if (isInput) return

      // Block all shortcuts during tutorial (tutorial has its own keyboard handler)
      if (useAppStore.getState().showOnboarding) return

      // Use e.code for layout-independent shortcuts (works with any keyboard layout)
      if ((e.ctrlKey || e.metaKey) && e.code === 'KeyB') {
        e.preventDefault()
        const id = useBoardStore.getState().createBoard('New Board')
        setActiveBoardId(id)
      }

      if ((e.ctrlKey || e.metaKey) && e.code === 'KeyN') {
        e.preventDefault()
        setNotesOpen(!useAppStore.getState().notesOpen)
      }

      if ((e.ctrlKey || e.metaKey) && e.code === 'KeyF') {
        e.preventDefault()
        setSearchPanelOpen(true)
      }

      // Ctrl+K — search / command palette
      if ((e.ctrlKey || e.metaKey) && e.code === 'KeyK') {
        e.preventDefault()
        setSearchPanelOpen(true)
      }

      // Ctrl+Q — quick add card
      if ((e.ctrlKey || e.metaKey) && e.code === 'KeyQ') {
        e.preventDefault()
        useAppStore.getState().setQuickAddOpen(true)
      }

      // Ctrl+Space — unified search/command palette
      if ((e.ctrlKey || e.metaKey) && e.code === 'Space') {
        e.preventDefault()
        setSearchPanelOpen(true)
      }

      // Ctrl+Tab — toggle sidebar (like Telegram)
      if ((e.ctrlKey || e.metaKey) && e.key === 'Tab') {
        e.preventDefault()
        toggleSidebar()
      }

      // Arrow navigation for cards
      const boardId = useAppStore.getState().activeBoardId
      const activeCardId = useAppStore.getState().activeCardId
      if (activeCardId || useAppStore.getState().searchPanelOpen) return // Don't navigate when modal/search is open

      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault()
        const focusedId = useAppStore.getState().focusedCardId
        const state = useBoardStore.getState()

        if (!boardId) return
        const board = state.boards[boardId]
        if (!board) return

        // Get visible columns and their cards
        const collapsedIds = useAppStore.getState().collapsedColumnIds
        const visibleColumns = board.columnOrder
          .map((cid) => state.columns[cid])
          .filter((col) => col && !collapsedIds.includes(col.id))

        if (visibleColumns.length === 0) return

        // Find current position
        let curColIdx = -1
        let curCardIdx = -1
        if (focusedId) {
          for (let ci = 0; ci < visibleColumns.length; ci++) {
            const idx = visibleColumns[ci].cardIds.indexOf(focusedId)
            if (idx !== -1) {
              curColIdx = ci
              curCardIdx = idx
              break
            }
          }
        }

        if (curColIdx === -1) {
          // No focus yet, set to first card of first column
          for (const col of visibleColumns) {
            if (col.cardIds.length > 0) {
              setFocusedCardId(col.cardIds[0])
              return
            }
          }
          return
        }

        const col = visibleColumns[curColIdx]
        if (e.key === 'ArrowDown') {
          if (curCardIdx < col.cardIds.length - 1) {
            setFocusedCardId(col.cardIds[curCardIdx + 1])
          }
        } else if (e.key === 'ArrowUp') {
          if (curCardIdx > 0) {
            setFocusedCardId(col.cardIds[curCardIdx - 1])
          }
        } else if (e.key === 'ArrowRight') {
          for (let ci = curColIdx + 1; ci < visibleColumns.length; ci++) {
            if (visibleColumns[ci].cardIds.length > 0) {
              const idx = Math.min(curCardIdx, visibleColumns[ci].cardIds.length - 1)
              setFocusedCardId(visibleColumns[ci].cardIds[idx])
              break
            }
          }
        } else if (e.key === 'ArrowLeft') {
          for (let ci = curColIdx - 1; ci >= 0; ci--) {
            if (visibleColumns[ci].cardIds.length > 0) {
              const idx = Math.min(curCardIdx, visibleColumns[ci].cardIds.length - 1)
              setFocusedCardId(visibleColumns[ci].cardIds[idx])
              break
            }
          }
        }
      }

      // Enter — open focused card
      if (e.key === 'Enter') {
        const focusedId = useAppStore.getState().focusedCardId
        if (focusedId) {
          e.preventDefault()
          setActiveCardId(focusedId)
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [activeBoardId, setActiveCardId, setArchivePanelOpen, setActiveBoardId, setSearchPanelOpen, setFocusedCardId, setNotesOpen, toggleSidebar])
}
