import { useState, useMemo, useRef, useEffect, useCallback, type MouseEvent as ReactMouseEvent, type CSSProperties } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent
} from '@dnd-kit/core'
import {
  SortableContext,
  horizontalListSortingStrategy,
  arrayMove
} from '@dnd-kit/sortable'
import { LayoutDashboard, Plus, Settings, StickyNote } from 'lucide-react'
import { useBoardStore, useAppStore } from '@/store'
import { useStickyStore } from '@/store/sticky-store'
import { playDrop } from '@/lib/sounds'
import { useSelectionStore } from '@/hooks/use-selection'
import { useTranslation } from '@/hooks/use-translation'
import { Column } from './Column'
import { Card } from './Card'
import { AddColumnButton } from './AddColumnButton'
import { BoardHeader } from './BoardHeader'
import { BoardStickyNote } from './BoardStickyNote'
import { TableView } from './TableView'
import { HeatmapView } from './HeatmapView'
import { TimelineView } from './TimelineView'
import { DragSelect } from './DragSelect'
import { EmptyState } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/Button'
import { ContextMenu, type ContextMenuItem } from '@/components/ui/ContextMenu'
import { cn } from '@/lib/utils'
import type { Card as CardType, Column as ColumnType } from '@/types'

export function BoardView() {
  const { t } = useTranslation()
  const activeBoardId = useAppStore((s) => s.activeBoardId)
  const setActiveBoardId = useAppStore((s) => s.setActiveBoardId)
  const boards = useBoardStore((s) => s.boards)
  const columns = useBoardStore((s) => s.columns)
  const cards = useBoardStore((s) => s.cards)
  const reorderColumns = useBoardStore((s) => s.reorderColumns)
  const moveCard = useBoardStore((s) => s.moveCard)
  const moveCardsToColumn = useBoardStore((s) => s.moveCardsToColumn)
  const reorderCardsInColumn = useBoardStore((s) => s.reorderCardsInColumn)
  const createBoard = useBoardStore((s) => s.createBoard)

  const viewMode = useAppStore((s) => s.viewMode)
  const boardBackground = useAppStore((s) => s.boardBackground)
  const setSettingsOpen = useAppStore((s) => s.setSettingsOpen)
  const createColumn = useBoardStore((s) => s.createColumn)
  const createStickyNote = useStickyStore((s) => s.createStickyNote)
  const stickyNotes = useStickyStore((s) => s.stickyNotes)
  const board = activeBoardId ? boards[activeBoardId] : null

  const boardStickyNotes = useMemo(() => {
    if (!activeBoardId) return []
    return Object.values(stickyNotes).filter((n) => n.boardId === activeBoardId)
  }, [activeBoardId, stickyNotes])

  const [activeId, setActiveId] = useState<string | null>(null)
  const [boardCtxMenu, setBoardCtxMenu] = useState<{ x: number; y: number } | null>(null)
  const [activeType, setActiveType] = useState<'card' | 'column' | null>(null)
  const companionCardIds = useRef<string[]>([])

  // Load background image as data URL (avoids file:// cross-origin issues)
  const [bgImageData, setBgImageData] = useState<{ url: string; small: boolean } | null>(null)
  useEffect(() => {
    if (!boardBackground.startsWith('image:')) {
      setBgImageData(null)
      return
    }
    const filePath = boardBackground.slice(6)
    let cancelled = false
    window.electronAPI.readFileAsDataUrl(filePath).then((dataUrl) => {
      if (cancelled) return
      // Detect image dimensions to decide cover vs tile
      const img = new Image()
      img.onload = () => {
        if (cancelled) return
        const isSmall = img.naturalWidth < 600 || img.naturalHeight < 600
        setBgImageData({ url: dataUrl, small: isSmall })
      }
      img.onerror = () => {
        if (cancelled) return
        setBgImageData({ url: dataUrl, small: false })
      }
      img.src = dataUrl
    }).catch(() => {
      if (!cancelled) setBgImageData(null)
    })
    return () => { cancelled = true }
  }, [boardBackground])

  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [isGrabbing, setIsGrabbing] = useState(false)
  const grabStart = useRef({ x: 0, scrollLeft: 0 })

  // Horizontal scroll on wheel (vertical scroll translates to horizontal)
  useEffect(() => {
    const el = scrollContainerRef.current
    if (!el) return

    const handleWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault()
        el.scrollLeft += e.deltaY
      }
    }

    el.addEventListener('wheel', handleWheel, { passive: false })
    // Capture el in closure for reliable cleanup
    return () => { el.removeEventListener('wheel', handleWheel) }
  }, [])

  // Grab to scroll (middle mouse button)
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 1) {
      e.preventDefault()
      setIsGrabbing(true)
      grabStart.current = { x: e.clientX, scrollLeft: scrollContainerRef.current?.scrollLeft ?? 0 }
    }
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isGrabbing || !scrollContainerRef.current) return
    const dx = e.clientX - grabStart.current.x
    scrollContainerRef.current.scrollLeft = grabStart.current.scrollLeft - dx
  }, [isGrabbing])

  const handleMouseUp = useCallback(() => {
    setIsGrabbing(false)
  }, [])

  const lang = t('sidebar.boards') === 'Доски' ? 'ru' : 'en'

  const handleBoardAreaContextMenu = useCallback((e: ReactMouseEvent) => {
    // Only trigger if clicking on the empty area (not on columns, cards, buttons)
    const target = e.target as HTMLElement
    if (target.closest('[data-no-board-ctx]')) return
    e.preventDefault()
    setBoardCtxMenu({ x: e.clientX, y: e.clientY })
  }, [])

  const boardCtxMenuItems: ContextMenuItem[] = useMemo(() => [
    { id: 'add-column', label: lang === 'ru' ? 'Добавить колонку' : 'Add column', icon: <Plus size={14} />, onClick: () => {
      if (activeBoardId) createColumn(activeBoardId, lang === 'ru' ? 'Новая колонка' : 'New column')
    }},
    { id: 'add-sticky', label: lang === 'ru' ? 'Стикер' : 'Sticky note', icon: <StickyNote size={14} />, onClick: () => {
      if (activeBoardId && boardCtxMenu) {
        const container = scrollContainerRef.current
        const scrollLeft = container?.scrollLeft ?? 0
        const scrollTop = container?.scrollTop ?? 0
        const rect = container?.getBoundingClientRect()
        const x = boardCtxMenu.x - (rect?.left ?? 0) + scrollLeft
        const y = boardCtxMenu.y - (rect?.top ?? 0) + scrollTop
        createStickyNote(activeBoardId, x, y)
      }
    }},
    { id: 'sep', label: '', separator: true },
    { id: 'settings', label: lang === 'ru' ? 'Настройки' : 'Settings', icon: <Settings size={14} />, onClick: () => setSettingsOpen(true) },
  ], [lang, activeBoardId, createColumn, setSettingsOpen, boardCtxMenu, createStickyNote])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  )

  const boardColumns = useMemo(() => {
    if (!board) return []
    return board.columnOrder.map((id) => columns[id]).filter(Boolean)
  }, [board, columns])

  // Must be before the early return — hooks cannot be called conditionally
  const lastDragOverRef = useRef(0)

  if (!board) {
    return (
      <EmptyState
        icon={LayoutDashboard}
        title={t('empty.noBoard')}
        description={t('empty.noBoardDesc')}
        action={
          <Button
            variant="primary"
            onClick={() => {
              const id = createBoard('My Board')
              setActiveBoardId(id)
            }}
          >
            {t('empty.createBoard')}
          </Button>
        }
        className="h-full"
      />
    )
  }

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const id = active.id as string
    setActiveId(id)
    setActiveType(active.data.current?.type ?? null)

    if (active.data.current?.type === 'card') {
      const selectedIds = useSelectionStore.getState().selectedCardIds
      if (selectedIds.has(id) && selectedIds.size > 1) {
        // Multi-card drag: track companion cards (all selected except the active one)
        companionCardIds.current = [...selectedIds].filter((cid) => cid !== id)
      } else {
        companionCardIds.current = []
        if (!selectedIds.has(id)) {
          useSelectionStore.getState().clearSelection()
        }
      }
    } else {
      companionCardIds.current = []
    }
  }

  const handleDragOver = (event: DragOverEvent) => {
    try {
      const { active, over } = event
      if (!over || activeType !== 'card') return

      // Throttle drag-over to avoid rapid state updates that crash the UI
      const now = Date.now()
      if (now - lastDragOverRef.current < 50) return
      lastDragOverRef.current = now

      const activeCard = active.data.current?.card as CardType | undefined
      if (!activeCard) return

      // Re-check card still exists in current state
      const currentCard = cards[activeCard.id]
      if (!currentCard) return

      const activeColumnId = currentCard.columnId
      let overColumnId: string | null = null
      let overIndex = 0

      if (over.data.current?.type === 'column') {
        overColumnId = over.id as string
        overIndex = columns[overColumnId]?.cardIds.length ?? 0
      } else if (over.data.current?.type === 'card') {
        const overCard = over.data.current.card as CardType
        overColumnId = overCard.columnId
        const col = columns[overColumnId]
        overIndex = col ? col.cardIds.indexOf(overCard.id) : 0
      }

      if (overColumnId && activeColumnId !== overColumnId) {
        moveCard(currentCard.id, activeColumnId, overColumnId, overIndex)
      }
    } catch {
      // Safely ignore drag errors
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    const companions = companionCardIds.current
    const dragType = activeType
    companionCardIds.current = []
    setActiveId(null)
    setActiveType(null)

    if (!over) return

    try {
      playDrop()

      if (dragType === 'column') {
        if (active.id !== over.id) {
          const oldIndex = board.columnOrder.indexOf(active.id as string)
          const overColId = over.data.current?.type === 'column'
            ? over.id as string
            : over.data.current?.card?.columnId
          if (!overColId) return
          const newIndex = board.columnOrder.indexOf(overColId as string)
          if (oldIndex !== -1 && newIndex !== -1) {
            reorderColumns(activeBoardId!, arrayMove(board.columnOrder, oldIndex, newIndex))
          }
        }
      } else if (dragType === 'card') {
        const activeCard = cards[active.id as string]
        if (!activeCard) return
        const columnId = activeCard.columnId
        const col = columns[columnId]
        if (!col) return

        if (over.data.current?.type === 'card') {
          const overCard = over.data.current.card as CardType
          if (overCard.columnId === columnId && active.id !== over.id) {
            const oldIndex = col.cardIds.indexOf(active.id as string)
            const newIndex = col.cardIds.indexOf(over.id as string)
            if (oldIndex !== -1 && newIndex !== -1) {
              reorderCardsInColumn(columnId, arrayMove(col.cardIds, oldIndex, newIndex))
            }
          }
        }

        // Move companion cards (multi-drag) to the same column, right after the active card
        if (companions.length > 0) {
          moveCardsToColumn(companions, activeCard.columnId, activeCard.id)
          useSelectionStore.getState().clearSelection()
        }
      }
    } catch {
      // Safely ignore drag errors
    }
  }

  const activeCard = activeId && activeType === 'card' ? cards[activeId] : null
  const activeColumn = activeId && activeType === 'column' ? columns[activeId] : null

  // Shared background classes & styles for all view modes
  const bgClasses = cn(
    boardBackground === 'dots' && 'bg-board-dots',
    boardBackground === 'grid' && 'bg-board-grid',
    boardBackground === 'lines' && 'bg-board-lines',
    boardBackground === 'crosshatch' && 'bg-board-crosshatch',
    boardBackground === 'diamonds' && 'bg-board-diamonds',
    boardBackground === 'zigzag' && 'bg-board-zigzag',
    boardBackground === 'anim-dots' && 'bg-board-anim-dots',
    boardBackground === 'anim-grid' && 'bg-board-anim-grid',
    boardBackground === 'anim-diamonds' && 'bg-board-anim-diamonds',
    boardBackground === 'anim-waves' && 'bg-board-anim-waves'
  )

  const bgStyles: CSSProperties = {
    ...(boardBackground.startsWith('#') ? { backgroundColor: boardBackground } : {}),
    ...(bgImageData ? {
      backgroundImage: bgImageData.small
        ? `linear-gradient(rgb(0 0 0 / 0.4), rgb(0 0 0 / 0.4)), url("${bgImageData.url}")`
        : `url("${bgImageData.url}")`,
      backgroundSize: bgImageData.small ? 'auto' : 'cover',
      backgroundPosition: bgImageData.small ? '0 0' : 'center',
      backgroundRepeat: bgImageData.small ? 'repeat' : 'no-repeat',
    } as CSSProperties : {})
  }

  if (viewMode === 'table' || viewMode === 'heatmap' || viewMode === 'timeline') {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <BoardHeader />
        <div className={cn('flex-1 flex flex-col overflow-hidden', bgClasses)} style={bgStyles}>
          {viewMode === 'table' && <TableView />}
          {viewMode === 'heatmap' && <HeatmapView />}
          {viewMode === 'timeline' && <TimelineView />}
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <BoardHeader />
      <div
        ref={scrollContainerRef}
        className={cn(
          'flex-1 overflow-x-auto overflow-y-hidden board-scroll relative',
          isGrabbing ? 'cursor-grabbing' : 'cursor-default',
          bgClasses
        )}
        style={{
          ...bgStyles
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onContextMenu={handleBoardAreaContextMenu}
      >
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 p-4 h-full items-start">
            <SortableContext
              items={board.columnOrder}
              strategy={horizontalListSortingStrategy}
            >
              {boardColumns.map((col) => (
                <Column key={col.id} column={col} />
              ))}
            </SortableContext>
            <AddColumnButton boardId={activeBoardId!} />
          </div>

          <DragOverlay dropAnimation={null}>
            {activeCard && (
              <div className="relative">
                <Card card={activeCard} isDragOverlay />
                {companionCardIds.current.length > 0 && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[rgb(var(--accent))] text-white text-xs font-bold flex items-center justify-center shadow-lg">
                    {companionCardIds.current.length + 1}
                  </div>
                )}
              </div>
            )}
            {activeColumn && <Column column={activeColumn} isDragOverlay />}
          </DragOverlay>
        </DndContext>
        {/* Sticky notes */}
        {boardStickyNotes.map((note) => (
          <BoardStickyNote key={note.id} note={note} />
        ))}
        <DragSelect containerRef={scrollContainerRef} />
        {boardCtxMenu && (
          <ContextMenu x={boardCtxMenu.x} y={boardCtxMenu.y} items={boardCtxMenuItems} onClose={() => setBoardCtxMenu(null)} />
        )}
      </div>
    </div>
  )
}
