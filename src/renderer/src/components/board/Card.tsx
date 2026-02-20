import { useState, useEffect, useCallback, useRef, type MouseEvent as ReactMouseEvent } from 'react'
import { createPortal } from 'react-dom'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  CheckCircle2, ChevronDown, ChevronRight,
  Eye, Copy, ArrowRightLeft, Flag, Tag, CheckSquare, Archive, Trash2, Pin
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAppStore, useBoardStore, useArchiveStore } from '@/store'
import { useSelectionStore } from '@/hooks/use-selection'
import { useToastStore } from '@/store/toast-store'
import { PRIORITY_CONFIG } from '@/lib/constants'
import { playSuccess, playDrop } from '@/lib/sounds'
import { CardBadges } from './CardBadges'
import { CardPreview } from './CardPreview'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Checkbox } from '@/components/ui/Checkbox'
import { ContextMenu, type ContextMenuItem } from '@/components/ui/ContextMenu'
import { useTranslation } from '@/hooks/use-translation'
import { createId } from '@/lib/id'
import type { Card as CardType, Priority } from '@/types'

interface CardProps {
  card: CardType
  isDragOverlay?: boolean
  dimmed?: boolean
}

const BORDER_RADIUS_MAP = { sm: 'rounded', md: 'rounded-lg', lg: 'rounded-xl' } as const

export function Card({ card, isDragOverlay, dimmed }: CardProps) {
  const { t } = useTranslation()
  const lang = t('sidebar.boards') === 'Доски' ? 'ru' : 'en'
  const setActiveCardId = useAppStore((s) => s.setActiveCardId)
  const cardDensity = useAppStore((s) => s.cardDensity)
  const cardBorderRadius = useAppStore((s) => s.cardBorderRadius)
  const focusedCardId = useAppStore((s) => s.focusedCardId)
  const isSelected = useSelectionStore((s) => s.selectedCardIds.has(card.id))
  const updateCard = useBoardStore((s) => s.updateCard)
  const toggleSubtask = useBoardStore((s) => s.toggleSubtask)
  const duplicateCard = useBoardStore((s) => s.duplicateCard)
  const deleteCard = useBoardStore((s) => s.deleteCard)
  const bulkSetPriority = useBoardStore((s) => s.bulkSetPriority)
  const bulkAddLabel = useBoardStore((s) => s.bulkAddLabel)
  const bulkMoveToColumn = useBoardStore((s) => s.bulkMoveToColumn)
  const bulkDelete = useBoardStore((s) => s.bulkDelete)
  const bulkSetCompleted = useBoardStore((s) => s.bulkSetCompleted)
  const archiveCard = useArchiveStore((s) => s.archiveCard)
  const addToast = useToastStore((s) => s.addToast)
  const [subtasksExpanded, setSubtasksExpanded] = useState(false)
  const [coverUrl, setCoverUrl] = useState<string | null>(null)
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number } | null>(null)
  const [fileDragOver, setFileDragOver] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [previewRect, setPreviewRect] = useState<DOMRect | null>(null)
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const cardRef = useRef<HTMLDivElement | null>(null)
  const isFocused = focusedCardId === card.id

  const handleFileDragOver = useCallback((e: React.DragEvent) => {
    if (e.dataTransfer.types.includes('Files')) {
      e.preventDefault()
      e.dataTransfer.dropEffect = 'copy'
      setFileDragOver(true)
    }
  }, [])

  const handleFileDragEnter = useCallback((e: React.DragEvent) => {
    if (e.dataTransfer.types.includes('Files')) {
      e.preventDefault()
      setFileDragOver(true)
    }
  }, [])

  const handleFileDragLeave = useCallback((e: React.DragEvent) => {
    // Only clear if actually leaving the card (not entering a child)
    const related = e.relatedTarget as HTMLElement | null
    if (related && (e.currentTarget as HTMLElement).contains(related)) return
    setFileDragOver(false)
  }, [])

  const handleFileDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    setFileDragOver(false)
    const files = e.dataTransfer.files
    if (!files.length) return
    const newAttachments = [...(card.attachments ?? [])]
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const destName = `${createId()}-${file.name}`
      try {
        const savedPath = file.path
          ? await window.electronAPI.copyAttachment(file.path, destName)
          : await window.electronAPI.saveDroppedFile(file.name, await file.arrayBuffer())
        const isImage = /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(file.name)
        newAttachments.push({
          id: `att-${createId()}`,
          name: file.name,
          path: savedPath,
          type: isImage ? 'image' : 'file',
          size: file.size,
          createdAt: new Date().toISOString()
        })
      } catch { /* ignore failed files */ }
    }
    updateCard(card.id, { attachments: newAttachments })
    playDrop()
    addToast(lang === 'ru' ? 'Файлы прикреплены' : 'Files attached', 'success')
  }, [card.id, card.attachments, updateCard, addToast, lang])

  const completedSubtasks = card.subtasks.filter((s) => s.completed).length
  const totalSubtasks = card.subtasks.length

  // Load cover image
  const coverAttachment = card.coverImageId
    ? card.attachments?.find((a) => a.id === card.coverImageId && a.type === 'image')
    : null

  useEffect(() => {
    let cancelled = false
    if (coverAttachment) {
      window.electronAPI.readFileAsDataUrl(coverAttachment.path)
        .then((url) => { if (!cancelled) setCoverUrl(url) })
        .catch(() => { if (!cancelled) setCoverUrl(null) })
    } else {
      setCoverUrl(null)
    }
    return () => { cancelled = true }
  }, [coverAttachment?.path])

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: card.id,
    data: { type: 'card', card }
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  }

  const priorityColor = PRIORITY_CONFIG[card.priority].borderColor
  const hasPriority = card.priority !== 'none'

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setCtxMenu({ x: e.clientX, y: e.clientY })
  }, [])

  const getContextMenuItems = useCallback((): ContextMenuItem[] => {
    const isTutorial = useAppStore.getState().showOnboarding
    const selectedIds = useSelectionStore.getState().selectedCardIds
    const isBulk = selectedIds.has(card.id) && selectedIds.size > 1
    const targetIds = isBulk ? [...selectedIds] : [card.id]
    const storeState = useBoardStore.getState()
    const board = storeState.boards[card.boardId]
    const columns = storeState.columns
    const globalLabels = storeState.globalLabels
    const boardColumns = board
      ? board.columnOrder.map((id) => columns[id]).filter(Boolean)
      : []

    const items: ContextMenuItem[] = []

    if (isBulk) {
      items.push({
        id: 'bulk-header', label: lang === 'ru' ? `Выбрано: ${targetIds.length}` : `${targetIds.length} selected`,
        disabled: true
      })
      items.push({ id: 'sep-header', label: '', separator: true })
    } else {
      items.push({
        id: 'open', label: t('context.open' as any),
        icon: <Eye size={14} />,
        onClick: () => setActiveCardId(card.id)
      })
    }

    items.push({
      id: 'duplicate', label: t('context.duplicate' as any),
      icon: <Copy size={14} />,
      onClick: () => {
        if (isBulk) {
          for (const id of targetIds) duplicateCard(id)
        } else {
          duplicateCard(card.id)
        }
        addToast(t('toast.cardDuplicated' as any), 'success')
      }
    })

    items.push({
      id: 'moveTo', label: t('context.moveTo' as any),
      icon: <ArrowRightLeft size={14} />,
      submenu: boardColumns.map((col) => ({
        id: `move-${col.id}`,
        label: col.title,
        disabled: !isBulk && col.id === card.columnId,
        onClick: () => {
          bulkMoveToColumn(targetIds, col.id)
          addToast(t('toast.cardMoved' as any), 'info')
        }
      }))
    })

    items.push({
      id: 'priority', label: t('context.priority' as any),
      icon: <Flag size={14} />,
      submenu: (['none', 'low', 'medium', 'high', 'urgent'] as Priority[]).map((p) => ({
        id: `pri-${p}`,
        label: t(`priority.${p}` as any),
        icon: p !== 'none'
          ? <span className="w-2 h-2 rounded-full" style={{ backgroundColor: PRIORITY_CONFIG[p].borderColor }} />
          : undefined,
        onClick: () => {
          bulkSetPriority(targetIds, p)
          addToast(t('toast.cardsUpdated' as any), 'info')
        }
      }))
    })

    items.push({
      id: 'label', label: t('context.label' as any),
      icon: <Tag size={14} />,
      submenu: globalLabels.slice(0, 10).map((label) => ({
        id: `lbl-${label.id}`,
        label: `${label.emoji ?? ''} ${label.name}`.trim(),
        icon: <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: label.color }} />,
        onClick: () => {
          bulkAddLabel(targetIds, label)
          addToast(t('toast.cardsUpdated' as any), 'info')
        }
      }))
    })

    items.push({ id: 'sep1', label: '', separator: true })

    const allCompleted = targetIds.every((id) => {
      const c = useBoardStore.getState().cards[id]
      return c?.completed
    })
    items.push({
      id: 'toggle-done',
      label: allCompleted ? t('context.markUndone' as any) : t('context.markDone' as any),
      icon: <CheckSquare size={14} />,
      onClick: () => {
        bulkSetCompleted(targetIds, !allCompleted)
        addToast(t('toast.cardsUpdated' as any), 'success')
      }
    })

    if (!isBulk) {
      items.push({
        id: 'pin',
        label: card.pinned ? (lang === 'ru' ? 'Открепить' : 'Unpin') : (lang === 'ru' ? 'Закрепить' : 'Pin to top'),
        icon: <Pin size={14} />,
        onClick: () => {
          updateCard(card.id, { pinned: !card.pinned })
          addToast(card.pinned ? (lang === 'ru' ? 'Откреплено' : 'Unpinned') : (lang === 'ru' ? 'Закреплено' : 'Pinned'), 'info')
        }
      })
    }

    if (!isBulk) {
      items.push({
        id: 'archive', label: t('context.archive' as any),
        icon: <Archive size={14} />,
        disabled: isTutorial,
        onClick: () => {
          const colTitle = columns[card.columnId]?.title ?? ''
          const deleted = deleteCard(card.id)
          if (deleted) archiveCard(deleted, colTitle)
          addToast(t('toast.cardDeleted' as any), 'info')
        }
      })
    }

    items.push({ id: 'sep2', label: '', separator: true })
    items.push({
      id: 'delete', label: t('context.delete' as any),
      icon: <Trash2 size={14} />,
      danger: true,
      disabled: isTutorial,
      onClick: () => {
        bulkDelete(targetIds)
        useSelectionStore.getState().clearSelection()
        addToast(t('toast.cardDeleted' as any), 'error')
      }
    })

    return items
  }, [card, lang, t, setActiveCardId, duplicateCard, deleteCard, archiveCard, bulkSetPriority, bulkAddLabel, bulkMoveToColumn, bulkDelete, bulkSetCompleted, addToast])

  const handleMouseEnter = useCallback(() => {
    if (isDragOverlay || dimmed) return
    hoverTimerRef.current = setTimeout(() => {
      if (cardRef.current) {
        setPreviewRect(cardRef.current.getBoundingClientRect())
        setShowPreview(true)
      }
    }, 500)
  }, [isDragOverlay, dimmed])

  const handleMouseLeave = useCallback(() => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current)
    hoverTimerRef.current = null
    setShowPreview(false)
  }, [])

  // Clear preview on click or drag
  useEffect(() => {
    if (isDragging) {
      setShowPreview(false)
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current)
    }
  }, [isDragging])

  // Clear hover timer on unmount
  useEffect(() => {
    return () => { if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current) }
  }, [])

  const setRefs = useCallback((node: HTMLElement | null) => {
    setNodeRef(node)
    cardRef.current = node as HTMLDivElement | null
  }, [setNodeRef])

  return (
    <>
    {ctxMenu && createPortal(
      <ContextMenu
        x={ctxMenu.x}
        y={ctxMenu.y}
        items={getContextMenuItems()}
        onClose={() => setCtxMenu(null)}
      />,
      document.body
    )}
    {showPreview && previewRect && !ctxMenu && createPortal(
      <CardPreview card={card} anchorRect={previewRect} />,
      document.body
    )}
    <div
      ref={setRefs}
      data-card={card.id}
      data-dropzone
      {...attributes}
      {...listeners}
      style={{
        ...style,
        ...(hasPriority ? {
          borderColor: `${priorityColor}40`,
          backgroundColor: `${priorityColor}06`
        } : {})
      }}
      className={cn(
        'group border cursor-grab active:cursor-grabbing',
        BORDER_RADIUS_MAP[cardBorderRadius] ?? 'rounded-lg',
        'transition-all duration-150',
        'shadow-sm hover:shadow-md overflow-hidden',
        !hasPriority && 'bg-surface-elevated border-border hover:border-border-hover',
        hasPriority && 'hover:brightness-105',
        isDragging && 'opacity-40',
        isDragOverlay && 'shadow-xl rotate-2 border-accent/50',
        card.completed && 'opacity-50',
        isSelected && 'outline outline-2 outline-offset-1 outline-[rgb(var(--accent))]',
        isFocused && !isSelected && 'outline outline-2 outline-[rgb(var(--accent)/0.5)]',
        fileDragOver && 'outline outline-2 outline-[rgb(var(--accent))] border-accent bg-accent/5',
        dimmed && 'opacity-30 scale-[0.97] pointer-events-none'
      )}
      onClick={() => { !isDragging && setActiveCardId(card.id); setShowPreview(false) }}
      onContextMenu={(e) => { handleContextMenu(e); setShowPreview(false) }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onDragEnter={handleFileDragEnter}
      onDragOver={handleFileDragOver}
      onDragLeave={handleFileDragLeave}
      onDrop={handleFileDrop}
    >
      {/* Cover image */}
      {coverUrl && cardDensity !== 'compact' && (
        <div className="w-full h-24 bg-surface-tertiary">
          <img src={coverUrl} alt="" className="w-full h-full object-cover" />
        </div>
      )}

      <div className={cn(
        cardDensity === 'compact' ? 'px-2 py-1.5' : cardDensity === 'spacious' ? 'p-4' : 'p-3'
      )}>
        <div className="flex items-start gap-1">
          {/* Completion toggle */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              if (!card.completed) playSuccess()
              updateCard(card.id, { completed: !card.completed })
            }}
            className={cn(
              'mt-0.5 shrink-0 rounded-full transition-colors',
              card.completed ? 'text-green-500' : 'text-content-tertiary hover:text-green-500 opacity-0 group-hover:opacity-100'
            )}
          >
            <CheckCircle2 size={cardDensity === 'compact' ? 14 : 16} fill={card.completed ? 'currentColor' : 'none'} />
          </button>

          <div className="flex-1 min-w-0">
            {card.pinned && (
              <Pin size={10} className="text-accent mb-0.5 -rotate-45" />
            )}
            <p className={cn(
              'text-content-primary leading-snug break-words',
              cardDensity === 'compact' ? 'text-xs' : cardDensity === 'spacious' ? 'text-sm leading-relaxed' : 'text-sm',
              card.completed && 'line-through text-content-tertiary'
            )}>
              {card.title}
            </p>
            {cardDensity !== 'compact' && <CardBadges card={card} />}
          </div>
        </div>

        {/* Inline subtask progress + expandable list */}
        {totalSubtasks > 0 && cardDensity !== 'compact' && (
          <div className="mt-2 ml-6" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setSubtasksExpanded(!subtasksExpanded)}
              className="flex items-center gap-1.5 w-full text-content-tertiary hover:text-content-secondary transition-colors"
            >
              {subtasksExpanded
                ? <ChevronDown size={12} className="shrink-0" />
                : <ChevronRight size={12} className="shrink-0" />
              }
              <ProgressBar value={completedSubtasks} max={totalSubtasks} className="flex-1" />
            </button>
            {subtasksExpanded && (
              <div className="mt-1.5 space-y-0.5">
                {card.subtasks.map((subtask) => (
                  <div
                    key={subtask.id}
                    className="flex items-center gap-1.5 py-0.5 text-xs cursor-pointer hover:bg-surface-tertiary rounded px-1 -mx-1"
                    onClick={() => toggleSubtask(card.id, subtask.id)}
                  >
                    <Checkbox
                      checked={subtask.completed}
                      onChange={() => toggleSubtask(card.id, subtask.id)}
                      size="sm"
                    />
                    <span className={cn(
                      'text-content-secondary',
                      subtask.completed && 'line-through text-content-tertiary'
                    )}>
                      {subtask.title}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
    </>
  )
}
