import { useState, useMemo, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useSortable } from '@dnd-kit/sortable'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  MoreHorizontal, Pencil, Archive, Trash2, GripVertical, BarChart3,
  ChevronsLeftRight, ArrowDownUp, ArrowUpDown, SortAsc, Clock, Type as TypeIcon, Sparkles, Palette
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useBoardStore, useArchiveStore, useFilterStore, useAppStore } from '@/store'
import { useToastStore } from '@/store/toast-store'
import { COLUMN_COLORS } from '@/lib/constants'
import { Card } from './Card'
import { AddCardButton } from './AddCardButton'
import { Dropdown, DropdownItem, DropdownSeparator } from '@/components/ui/Dropdown'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { ContextMenu, type ContextMenuItem } from '@/components/ui/ContextMenu'
import { useTranslation } from '@/hooks/use-translation'
import { useSelectionStore } from '@/hooks/use-selection'
import { getDueDateStatus } from '@/lib/date'
import type { Card as CardType, Column as ColumnType } from '@/types'

interface ColumnProps {
  column: ColumnType
  isDragOverlay?: boolean
}

export function Column({ column, isDragOverlay }: ColumnProps) {
  const { t } = useTranslation()
  const cards = useBoardStore((s) => s.cards)
  const updateColumn = useBoardStore((s) => s.updateColumn)
  const deleteColumn = useBoardStore((s) => s.deleteColumn)
  const sortColumnCards = useBoardStore((s) => s.sortColumnCards)
  const archiveColumn = useArchiveStore((s) => s.archiveColumn)
  const rawColumnWidth = useAppStore((s) => s.columnWidth)
  const focusMode = useAppStore((s) => s.focusMode)
  const columnWidth = focusMode ? Math.min(rawColumnWidth, 260) : rawColumnWidth
  const collapsedColumnIds = useAppStore((s) => s.collapsedColumnIds)
  const toggleColumnCollapse = useAppStore((s) => s.toggleColumnCollapse)
  const addToast = useToastStore((s) => s.addToast)
  const isCollapsed = collapsedColumnIds.includes(column.id)
  const lang = t('sidebar.boards') === 'Доски' ? 'ru' : 'en'
  const setHoveredColumnId = useSelectionStore((s) => s.setHoveredColumnId)

  const searchQuery = useFilterStore((s) => s.searchQuery)
  const filterLabelIds = useFilterStore((s) => s.labelIds)
  const filterPriorities = useFilterStore((s) => s.priorities)
  const showOverdueOnly = useFilterStore((s) => s.showOverdueOnly)

  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(column.title)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number } | null>(null)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: column.id,
    data: { type: 'column', column }
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  }

  const hasActiveFilter = !!(searchQuery || filterLabelIds.length > 0 || filterPriorities.length > 0 || showOverdueOnly)

  const { filteredCards, dimmedCardIds } = useMemo(() => {
    const allCards = column.cardIds
      .map((id) => cards[id])
      .filter((card): card is CardType => !!card)

    const matchSet = new Set<string>()
    const dimSet = new Set<string>()

    for (const card of allCards) {
      let matches = true
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        if (!card.title.toLowerCase().includes(q) && !card.description.toLowerCase().includes(q)) {
          matches = false
        }
      }
      if (matches && filterLabelIds.length > 0 && !card.labels.some((l) => filterLabelIds.includes(l.id))) {
        matches = false
      }
      if (matches && filterPriorities.length > 0 && !filterPriorities.includes(card.priority)) {
        matches = false
      }
      if (matches && showOverdueOnly) {
        const status = getDueDateStatus(card.dueDate)
        if (status !== 'overdue') matches = false
      }
      if (matches) matchSet.add(card.id)
      else dimSet.add(card.id)
    }

    // Sort: pinned first, then matching (completed at bottom within each group), then dimmed
    const sorted = [...allCards].sort((a, b) => {
      // Pinned cards always stay at top
      const aPinned = a.pinned ? 0 : 1
      const bPinned = b.pinned ? 0 : 1
      if (aPinned !== bPinned) return aPinned - bPinned
      const aMatch = matchSet.has(a.id) ? 0 : 1
      const bMatch = matchSet.has(b.id) ? 0 : 1
      if (aMatch !== bMatch) return aMatch - bMatch
      const ac = a.completed ? 1 : 0
      const bc = b.completed ? 1 : 0
      return ac - bc
    })

    return { filteredCards: sorted, dimmedCardIds: hasActiveFilter ? dimSet : new Set<string>() }
  }, [column.cardIds, cards, searchQuery, filterLabelIds, filterPriorities, showOverdueOnly, hasActiveFilter])

  const handleRename = () => {
    if (title.trim() && title.trim() !== column.title) {
      updateColumn(column.id, { title: title.trim() })
    } else {
      setTitle(column.title)
    }
    setEditing(false)
  }

  const handleDelete = () => {
    if (useAppStore.getState().showOnboarding) return
    deleteColumn(column.id)
    setDeleteConfirm(false)
  }

  const handleArchive = () => {
    if (useAppStore.getState().showOnboarding) return
    const colCards = column.cardIds.map((id) => cards[id]).filter(Boolean)
    archiveColumn(column, colCards)
    deleteColumn(column.id)
  }

  const handleHeaderContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setCtxMenu({ x: e.clientX, y: e.clientY })
  }, [])

  const ctxMenuItems: ContextMenuItem[] = useMemo(() => [
    { id: 'rename', label: lang === 'ru' ? 'Переименовать' : 'Rename', icon: <Pencil size={14} />, onClick: () => setEditing(true) },
    { id: 'collapse', label: lang === 'ru' ? 'Свернуть' : 'Collapse', icon: <ChevronsLeftRight size={14} />, onClick: () => toggleColumnCollapse(column.id) },
    { id: 'sep-1', label: '', separator: true },
    {
      id: 'sort', label: lang === 'ru' ? 'Сортировать' : 'Sort by', icon: <ArrowUpDown size={14} />,
      submenu: [
        { id: 'sort-priority', label: lang === 'ru' ? 'По приоритету' : 'By priority', onClick: () => { sortColumnCards(column.id, 'priority'); addToast(lang === 'ru' ? 'Отсортировано' : 'Sorted', 'info') } },
        { id: 'sort-due', label: lang === 'ru' ? 'По дедлайну' : 'By due date', onClick: () => { sortColumnCards(column.id, 'dueDate'); addToast(lang === 'ru' ? 'Отсортировано' : 'Sorted', 'info') } },
        { id: 'sort-title', label: lang === 'ru' ? 'По названию' : 'By title', onClick: () => { sortColumnCards(column.id, 'title'); addToast(lang === 'ru' ? 'Отсортировано' : 'Sorted', 'info') } },
        { id: 'sort-created', label: lang === 'ru' ? 'По дате создания' : 'By created', onClick: () => { sortColumnCards(column.id, 'created'); addToast(lang === 'ru' ? 'Отсортировано' : 'Sorted', 'info') } },
      ]
    },
    {
      id: 'color', label: lang === 'ru' ? 'Цвет' : 'Color', icon: <Palette size={14} />,
      submenu: COLUMN_COLORS.map((color, i) => ({
        id: `color-${i}`,
        label: color ?? (lang === 'ru' ? 'Без цвета' : 'No color'),
        icon: <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: color ?? 'rgb(var(--bg-tertiary))' }} />,
        onClick: () => updateColumn(column.id, { color: color ?? undefined })
      }))
    },
    { id: 'sep-2', label: '', separator: true },
    { id: 'archive', label: lang === 'ru' ? 'Архивировать' : 'Archive', icon: <Archive size={14} />, disabled: useAppStore.getState().showOnboarding, onClick: handleArchive },
    { id: 'delete', label: lang === 'ru' ? 'Удалить' : 'Delete', icon: <Trash2 size={14} />, danger: true, disabled: useAppStore.getState().showOnboarding, onClick: () => setDeleteConfirm(true) },
  ], [lang, column.id, toggleColumnCollapse, sortColumnCards, addToast, updateColumn, handleArchive])

  if (isCollapsed) {
    return (
      <>
        <div
          ref={setNodeRef}
          style={style}
          className={cn(
            'flex flex-col items-center bg-surface-secondary rounded-xl py-3 px-1 cursor-pointer hover:bg-surface-tertiary transition-colors',
            isDragging && 'opacity-40'
          )}
          onClick={() => toggleColumnCollapse(column.id)}
          title={lang === 'ru' ? 'Развернуть' : 'Expand'}
        >
          <button
            {...attributes}
            {...listeners}
            className="p-0.5 rounded text-content-tertiary hover:text-content-primary cursor-grab active:cursor-grabbing shrink-0 mb-2"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical size={14} />
          </button>
          <span
            className="text-xs font-semibold text-content-primary whitespace-nowrap"
            style={{ writingMode: 'vertical-lr', textOrientation: 'mixed' }}
          >
            {column.title}
          </span>
          <span className="mt-2 text-[10px] text-content-tertiary bg-surface-tertiary rounded-full w-5 h-5 flex items-center justify-center">
            {column.cardIds.length}
          </span>
        </div>
      </>
    )
  }

  return (
    <>
      <div
        ref={setNodeRef}
        onMouseEnter={() => setHoveredColumnId(column.id)}
        onMouseLeave={() => setHoveredColumnId(null)}
        style={{
          ...style,
          width: columnWidth,
          minWidth: columnWidth,
          borderTopColor: column.color ?? undefined,
          borderTopWidth: column.color ? '3px' : undefined,
          borderTopStyle: column.color ? 'solid' : undefined
        }}
        data-column={column.id}
        className={cn(
          'flex flex-col bg-surface-secondary rounded-xl max-h-full overflow-hidden',
          isDragging && 'opacity-40',
          isDragOverlay && 'shadow-xl rotate-1'
        )}
      >
        {/* Column header */}
        <div
          className="flex items-center gap-1 px-3 py-2.5 shrink-0"
          style={column.color ? {
            backgroundColor: `${column.color}10`,
            borderBottom: `2px solid ${column.color}40`
          } : {
            borderBottom: '1px solid rgb(var(--border-color))'
          }}
          onContextMenu={handleHeaderContextMenu}
        >
          <button
            {...attributes}
            {...listeners}
            className="p-0.5 rounded text-content-tertiary hover:text-content-primary hover:bg-surface-tertiary transition-colors cursor-grab active:cursor-grabbing shrink-0"
          >
            <GripVertical size={14} />
          </button>

          {editing ? (
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleRename}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRename()
                if (e.key === 'Escape') { setTitle(column.title); setEditing(false) }
              }}
              className="flex-1 bg-transparent text-sm font-semibold text-content-primary outline-none px-1"
            />
          ) : (
            <h3
              className="flex-1 text-sm font-semibold text-content-primary px-1 truncate cursor-pointer"
              onDoubleClick={() => setEditing(true)}
            >
              {column.title}
            </h3>
          )}

          <span className="text-xs text-content-tertiary tabular-nums mr-1">
            {filteredCards.length}
          </span>

          <Dropdown
            trigger={
              <button className="p-1 rounded text-content-tertiary hover:text-content-primary hover:bg-surface-tertiary transition-colors">
                <MoreHorizontal size={14} />
              </button>
            }
            align="right"
          >
            <DropdownItem onClick={() => setEditing(true)}>
              <Pencil size={14} /> {t('column.rename')}
            </DropdownItem>
            <DropdownItem onClick={() => toggleColumnCollapse(column.id)}>
              <ChevronsLeftRight size={14} /> {t('column.collapse' as any)}
            </DropdownItem>
            <DropdownItem onClick={() => updateColumn(column.id, { showProgress: column.showProgress === false ? true : false })}>
              <BarChart3 size={14} /> {column.showProgress !== false ? t('column.hideProgress' as any) : t('column.showProgress' as any)}
            </DropdownItem>
            <DropdownSeparator />
            {/* Sort */}
            <div className="px-3 py-1.5 text-[10px] font-medium text-content-tertiary uppercase tracking-wider">
              {t('column.sort' as any)}
            </div>
            <DropdownItem onClick={() => { sortColumnCards(column.id, 'priority'); addToast(t('toast.columnSorted' as any), 'info') }}>
              <ArrowUpDown size={14} /> {t('sort.byPriority' as any)}
            </DropdownItem>
            <DropdownItem onClick={() => { sortColumnCards(column.id, 'dueDate'); addToast(t('toast.columnSorted' as any), 'info') }}>
              <Clock size={14} /> {t('sort.byDueDate' as any)}
            </DropdownItem>
            <DropdownItem onClick={() => { sortColumnCards(column.id, 'title'); addToast(t('toast.columnSorted' as any), 'info') }}>
              <TypeIcon size={14} /> {t('sort.byTitle' as any)}
            </DropdownItem>
            <DropdownItem onClick={() => { sortColumnCards(column.id, 'created'); addToast(t('toast.columnSorted' as any), 'info') }}>
              <Sparkles size={14} /> {t('sort.byCreated' as any)}
            </DropdownItem>
            <DropdownSeparator />
            <DropdownItem onClick={handleArchive}>
              <Archive size={14} /> {t('column.archive')}
            </DropdownItem>
            <DropdownSeparator />
            {/* Color picker */}
            <div className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
              <div className="text-xs font-medium text-content-tertiary mb-1.5">{t('column.color')}</div>
              <div className="flex flex-wrap gap-1.5">
                {COLUMN_COLORS.map((color, i) => (
                  <button
                    key={i}
                    onClick={() => updateColumn(column.id, { color: color ?? undefined })}
                    className={cn(
                      'w-5 h-5 rounded-full border-2 transition-all hover:scale-110',
                      column.color === color ? 'border-content-primary scale-110' : 'border-transparent',
                      !color && 'bg-surface-tertiary border-border'
                    )}
                    style={color ? { backgroundColor: color } : undefined}
                  />
                ))}
              </div>
            </div>
            <DropdownSeparator />
            <DropdownItem danger onClick={() => setDeleteConfirm(true)}>
              <Trash2 size={14} /> {t('column.delete')}
            </DropdownItem>
          </Dropdown>
        </div>

        {/* Column progress bar */}
        {column.showProgress !== false && filteredCards.length > 0 && (() => {
          const completed = filteredCards.filter((c) => c.completed).length
          const pct = Math.round((completed / filteredCards.length) * 100)
          return (
            <div className="px-3 pb-1 shrink-0">
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1 bg-surface-tertiary rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: column.color ?? 'rgb(var(--accent))'
                    }}
                  />
                </div>
                <span className="text-[10px] text-content-tertiary tabular-nums">{pct}%</span>
              </div>
            </div>
          )
        })()}

        {/* Cards */}
        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1.5 scrollbar-thin">
          <SortableContext items={filteredCards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
            {filteredCards.map((card) => (
              <Card key={card.id} card={card} dimmed={dimmedCardIds.has(card.id)} />
            ))}
          </SortableContext>
        </div>

        {/* Add card */}
        <div className="px-1 pb-2 shrink-0">
          <AddCardButton columnId={column.id} />
        </div>
      </div>

      {ctxMenu && createPortal(
        <ContextMenu x={ctxMenu.x} y={ctxMenu.y} items={ctxMenuItems} onClose={() => setCtxMenu(null)} />,
        document.body
      )}

      <ConfirmDialog
        open={deleteConfirm}
        onClose={() => setDeleteConfirm(false)}
        onConfirm={handleDelete}
        title={t('column.deleteTitle')}
        message={t('column.deleteMsg', { name: column.title })}
        confirmLabel={t('common.delete')}
        danger
      />
    </>
  )
}
