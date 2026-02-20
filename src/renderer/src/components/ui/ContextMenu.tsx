import { useState, useEffect, useRef, useCallback } from 'react'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { playPopup } from '@/lib/sounds'

export interface ContextMenuItem {
  id: string
  label: string
  icon?: React.ReactNode
  danger?: boolean
  disabled?: boolean
  separator?: boolean
  submenu?: ContextMenuItem[]
  onClick?: () => void
}

interface ContextMenuProps {
  x: number
  y: number
  items: ContextMenuItem[]
  onClose: () => void
}

export function ContextMenu({ x, y, items, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)
  const [submenuId, setSubmenuId] = useState<string | null>(null)
  const [pos, setPos] = useState({ x, y })
  const submenuTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Play popup sound on mount
  useEffect(() => { playPopup() }, [])

  const clearSubmenuTimer = useCallback(() => {
    if (submenuTimer.current) {
      clearTimeout(submenuTimer.current)
      submenuTimer.current = null
    }
  }, [])

  const startSubmenuTimer = useCallback(() => {
    clearSubmenuTimer()
    submenuTimer.current = setTimeout(() => setSubmenuId(null), 150)
  }, [clearSubmenuTimer])

  // Adjust position to stay within viewport
  useEffect(() => {
    const el = menuRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const nx = x + rect.width > window.innerWidth ? window.innerWidth - rect.width - 8 : x
    const ny = y + rect.height > window.innerHeight ? window.innerHeight - rect.height - 8 : y
    setPos({ x: Math.max(4, nx), y: Math.max(4, ny) })
  }, [x, y])

  // Close on outside click or Escape
  useEffect(() => {
    const handleClick = () => onClose()
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [onClose])

  // Cleanup timer on unmount
  useEffect(() => {
    return () => clearSubmenuTimer()
  }, [clearSubmenuTimer])

  return (
    <div
      ref={menuRef}
      className="fixed z-[200] bg-surface-elevated border border-border rounded-xl shadow-2xl py-1 min-w-[180px] max-w-[260px] no-drag"
      style={{ left: pos.x, top: pos.y, WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      onMouseDown={(e) => e.stopPropagation()}
      onContextMenu={(e) => e.preventDefault()}
    >
      {items.map((item) => {
        if (item.separator) {
          return <div key={item.id} className="h-px bg-border my-1" />
        }
        return (
          <ContextMenuItemRow
            key={item.id}
            item={item}
            isSubmenuOpen={submenuId === item.id}
            onOpenSubmenu={(id) => { clearSubmenuTimer(); setSubmenuId(id) }}
            onStartCloseTimer={startSubmenuTimer}
            onClearCloseTimer={clearSubmenuTimer}
            onClose={onClose}
          />
        )
      })}
    </div>
  )
}

function ContextMenuItemRow({
  item,
  isSubmenuOpen,
  onOpenSubmenu,
  onStartCloseTimer,
  onClearCloseTimer,
  onClose,
}: {
  item: ContextMenuItem
  isSubmenuOpen: boolean
  onOpenSubmenu: (id: string) => void
  onStartCloseTimer: () => void
  onClearCloseTimer: () => void
  onClose: () => void
}) {
  const rowRef = useRef<HTMLDivElement>(null)
  const hasSubmenu = item.submenu && item.submenu.length > 0

  const handleClick = useCallback(() => {
    if (item.disabled) return
    if (hasSubmenu) {
      onOpenSubmenu(item.id)
      return
    }
    item.onClick?.()
    onClose()
  }, [item, hasSubmenu, onOpenSubmenu, onClose])

  const handleMouseEnter = useCallback(() => {
    if (hasSubmenu) {
      onClearCloseTimer()
      onOpenSubmenu(item.id)
    } else {
      // Non-submenu item: schedule close of any open submenu
      onStartCloseTimer()
    }
  }, [hasSubmenu, onClearCloseTimer, onOpenSubmenu, onStartCloseTimer, item.id])

  const handleMouseLeave = useCallback(() => {
    if (hasSubmenu) {
      onStartCloseTimer()
    }
  }, [hasSubmenu, onStartCloseTimer])

  return (
    <div
      ref={rowRef}
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        onClick={handleClick}
        disabled={item.disabled}
        className={cn(
          'w-full flex items-center gap-2 px-3 py-1.5 text-sm transition-colors text-left',
          item.disabled
            ? 'text-content-tertiary cursor-default'
            : item.danger
              ? 'text-red-400 hover:bg-red-500/10'
              : 'text-content-primary hover:bg-surface-tertiary'
        )}
      >
        {item.icon && <span className="w-4 h-4 flex items-center justify-center shrink-0">{item.icon}</span>}
        <span className="flex-1 truncate">{item.label}</span>
        {hasSubmenu && <ChevronRight size={12} className="shrink-0 text-content-tertiary" />}
      </button>

      {/* Submenu */}
      {hasSubmenu && isSubmenuOpen && (
        <SubmenuPanel
          items={item.submenu!}
          parentRef={rowRef}
          onClose={onClose}
          onMouseEnter={onClearCloseTimer}
          onMouseLeave={onStartCloseTimer}
        />
      )}
    </div>
  )
}

function SubmenuPanel({
  items,
  parentRef,
  onClose,
  onMouseEnter,
  onMouseLeave,
}: {
  items: ContextMenuItem[]
  parentRef: React.RefObject<HTMLDivElement | null>
  onClose: () => void
  onMouseEnter: () => void
  onMouseLeave: () => void
}) {
  const subRef = useRef<HTMLDivElement>(null)
  const [side, setSide] = useState<'right' | 'left'>('right')

  useEffect(() => {
    const parent = parentRef.current
    const sub = subRef.current
    if (!parent || !sub) return
    const pr = parent.getBoundingClientRect()
    const sr = sub.getBoundingClientRect()
    if (pr.right + sr.width > window.innerWidth) setSide('left')
  }, [parentRef])

  return (
    <div
      ref={subRef}
      className={cn(
        'absolute top-0 z-[210] bg-surface-elevated border border-border rounded-xl shadow-2xl py-1 min-w-[160px] max-w-[240px]',
        side === 'right' ? 'left-full ml-0.5' : 'right-full mr-0.5'
      )}
      onMouseDown={(e) => e.stopPropagation()}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {items.map((item) => {
        if (item.separator) {
          return <div key={item.id} className="h-px bg-border my-1" />
        }
        return (
          <button
            key={item.id}
            onClick={() => { item.onClick?.(); onClose() }}
            disabled={item.disabled}
            className={cn(
              'w-full flex items-center gap-2 px-3 py-1.5 text-sm transition-colors text-left',
              item.disabled
                ? 'text-content-tertiary cursor-default'
                : item.danger
                  ? 'text-red-400 hover:bg-red-500/10'
                  : 'text-content-primary hover:bg-surface-tertiary'
            )}
          >
            {item.icon && <span className="w-4 h-4 flex items-center justify-center shrink-0">{item.icon}</span>}
            <span className="flex-1 truncate">{item.label}</span>
          </button>
        )
      })}
    </div>
  )
}
