import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Minus, Square, X, Maximize2, Home, StickyNote, Search } from 'lucide-react'
import { useAppStore, useBoardStore } from '@/store'
import { ContextMenu, type ContextMenuItem } from '@/components/ui/ContextMenu'
import { BoardIcon } from '@/components/ui/BoardIconPicker'
import { useTranslation } from '@/hooks/use-translation'
import { cn } from '@/lib/utils'

export function Titlebar() {
  const { t } = useTranslation()
  const lang = useAppStore((s) => s.language)
  const [isMaximized, setIsMaximized] = useState(false)
  const setShowDashboard = useAppStore((s) => s.setShowDashboard)
  const showDashboard = useAppStore((s) => s.showDashboard)
  const setActiveBoardId = useAppStore((s) => s.setActiveBoardId)
  const activeBoardId = useAppStore((s) => s.activeBoardId)
  const notesOpen = useAppStore((s) => s.notesOpen)
  const setNotesOpen = useAppStore((s) => s.setNotesOpen)
  const setSearchPanelOpen = useAppStore((s) => s.setSearchPanelOpen)
  const titlebarPins = useAppStore((s) => s.titlebarPins)
  const removeTitlebarPin = useAppStore((s) => s.removeTitlebarPin)
  const reorderTitlebarPins = useAppStore((s) => s.reorderTitlebarPins)
  const boards = useBoardStore((s) => s.boards)
  const [pinCtxMenu, setPinCtxMenu] = useState<{ x: number; y: number; pinId: string } | null>(null)

  // Drag reorder state
  const [dragPinId, setDragPinId] = useState<string | null>(null)
  const [dragOverPinId, setDragOverPinId] = useState<string | null>(null)

  useEffect(() => {
    window.electronAPI.isMaximized().then(setIsMaximized)
    const unsub = window.electronAPI.onMaximizeChange(setIsMaximized)
    return unsub
  }, [])

  const handlePinDragStart = useCallback((pinId: string) => {
    setDragPinId(pinId)
  }, [])

  const handlePinDragOver = useCallback((e: React.DragEvent, pinId: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverPinId(pinId)
  }, [])

  const handlePinDrop = useCallback((targetPinId: string) => {
    if (!dragPinId || dragPinId === targetPinId) {
      setDragPinId(null)
      setDragOverPinId(null)
      return
    }
    const pins = [...titlebarPins]
    const fromIdx = pins.findIndex((p) => p.id === dragPinId)
    const toIdx = pins.findIndex((p) => p.id === targetPinId)
    if (fromIdx !== -1 && toIdx !== -1) {
      const [moved] = pins.splice(fromIdx, 1)
      pins.splice(toIdx, 0, moved)
      reorderTitlebarPins(pins)
    }
    setDragPinId(null)
    setDragOverPinId(null)
  }, [dragPinId, titlebarPins, reorderTitlebarPins])

  const handlePinDragEnd = useCallback(() => {
    setDragPinId(null)
    setDragOverPinId(null)
  }, [])

  return (
    <div className="h-9 flex items-center justify-between bg-surface-secondary border-b border-border select-none shrink-0">
      <div className="drag-region flex-1 h-full flex items-center px-4 gap-1">
        <span className="text-xs font-semibold text-content-secondary tracking-wide mr-2">
          FlowZik
        </span>
        <button
          onClick={() => setShowDashboard(true)}
          className={cn(
            'no-drag h-6 w-6 flex items-center justify-center rounded transition-colors',
            showDashboard ? 'text-accent bg-accent/10' : 'text-content-tertiary hover:text-content-primary hover:bg-surface-tertiary'
          )}
          title={lang === 'ru' ? 'Обзор' : 'Dashboard'}
        >
          <Home size={13} />
        </button>
        <button
          onClick={() => setNotesOpen(!notesOpen)}
          className={cn(
            'no-drag h-6 w-6 flex items-center justify-center rounded transition-colors',
            notesOpen ? 'text-accent bg-accent/10' : 'text-content-tertiary hover:text-content-primary hover:bg-surface-tertiary'
          )}
          title={lang === 'ru' ? 'Заметки' : 'Notes'}
        >
          <StickyNote size={13} />
        </button>
        <button
          onClick={() => setSearchPanelOpen(true)}
          className="no-drag h-6 w-6 flex items-center justify-center rounded text-content-tertiary hover:text-content-primary hover:bg-surface-tertiary transition-colors"
          title={lang === 'ru' ? 'Поиск (Ctrl+Space)' : 'Search (Ctrl+Space)'}
        >
          <Search size={13} />
        </button>

        {/* Custom pins — draggable */}
        {titlebarPins.length > 0 && (
          <>
            <div className="w-px h-4 bg-border mx-1" />
            {titlebarPins.map((pin) => {
              const board = pin.type === 'board' ? boards[pin.targetId] : null
              const isActive = pin.type === 'board' && activeBoardId === pin.targetId
              if (pin.type === 'board' && !board) return null
              return (
                <button
                  key={pin.id}
                  draggable
                  onDragStart={() => handlePinDragStart(pin.id)}
                  onDragOver={(e) => handlePinDragOver(e, pin.id)}
                  onDrop={() => handlePinDrop(pin.id)}
                  onDragEnd={handlePinDragEnd}
                  onClick={() => {
                    if (pin.type === 'board') {
                      setActiveBoardId(pin.targetId)
                      setShowDashboard(false)
                    }
                  }}
                  onContextMenu={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setPinCtxMenu({ x: e.clientX, y: e.clientY, pinId: pin.id })
                  }}
                  className={cn(
                    'no-drag h-6 px-1.5 flex items-center justify-center gap-1 rounded text-[11px] transition-all cursor-grab active:cursor-grabbing',
                    isActive
                      ? 'text-accent bg-accent/10'
                      : 'text-content-tertiary hover:text-content-primary hover:bg-surface-tertiary',
                    dragPinId === pin.id && 'opacity-40',
                    dragOverPinId === pin.id && dragPinId !== pin.id && 'ring-1 ring-accent/50'
                  )}
                  title={board?.title ?? pin.label}
                >
                  <BoardIcon name={board?.icon} size={11} />
                  <span className="max-w-[60px] truncate">{board?.title ?? pin.label}</span>
                </button>
              )
            })}
          </>
        )}
      </div>
      <div className="flex h-full no-drag">
        <button
          onClick={() => window.electronAPI.minimizeWindow()}
          className="h-full w-11 flex items-center justify-center text-content-tertiary hover:bg-surface-tertiary hover:text-content-primary transition-colors"
        >
          <Minus size={14} />
        </button>
        <button
          onClick={() => window.electronAPI.maximizeWindow()}
          className="h-full w-11 flex items-center justify-center text-content-tertiary hover:bg-surface-tertiary hover:text-content-primary transition-colors"
        >
          {isMaximized ? <Square size={11} /> : <Maximize2 size={13} />}
        </button>
        <button
          onClick={() => window.electronAPI.closeWindow()}
          className="h-full w-11 flex items-center justify-center text-content-tertiary hover:bg-red-500 hover:text-white transition-colors"
        >
          <X size={15} />
        </button>
      </div>

      {pinCtxMenu && createPortal(
        <ContextMenu
          x={pinCtxMenu.x}
          y={pinCtxMenu.y}
          items={[
            { id: 'remove', label: lang === 'ru' ? 'Убрать закрепление' : 'Remove pin', icon: <X size={14} />, danger: true, onClick: () => removeTitlebarPin(pinCtxMenu.pinId) }
          ]}
          onClose={() => setPinCtxMenu(null)}
        />,
        document.body
      )}
    </div>
  )
}
