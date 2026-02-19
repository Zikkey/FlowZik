import { useState, useMemo } from 'react'
import { ArrowUpDown, ArrowUp, ArrowDown, Pin, Paperclip } from 'lucide-react'
import { useAppStore, useBoardStore, useFilterStore } from '@/store'
import { useTranslation } from '@/hooks/use-translation'
import { PRIORITY_CONFIG } from '@/lib/constants'
import { getDueDateStatus, formatDueDate } from '@/lib/date'
import { Checkbox } from '@/components/ui/Checkbox'
import { cn } from '@/lib/utils'
import type { Card, Priority } from '@/types'

type SortKey = 'title' | 'column' | 'priority' | 'dueDate' | 'subtasks' | 'completed'
type SortDir = 'asc' | 'desc'

const PRIORITY_ORDER: Record<Priority, number> = {
  none: 0, low: 1, medium: 2, high: 3, urgent: 4
}

export function TableView() {
  const { t } = useTranslation()
  const activeBoardId = useAppStore((s) => s.activeBoardId)
  const setActiveCardId = useAppStore((s) => s.setActiveCardId)
  const columns = useBoardStore((s) => s.columns)
  const cards = useBoardStore((s) => s.cards)
  const boards = useBoardStore((s) => s.boards)
  const updateCard = useBoardStore((s) => s.updateCard)
  const searchQuery = useFilterStore((s) => s.searchQuery)
  const labelIds = useFilterStore((s) => s.labelIds)
  const priorities = useFilterStore((s) => s.priorities)
  const showOverdueOnly = useFilterStore((s) => s.showOverdueOnly)

  const [sortKey, setSortKey] = useState<SortKey>('title')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  const board = activeBoardId ? boards[activeBoardId] : null

  const allCards = useMemo(() => {
    if (!board) return []
    const result: Card[] = []
    for (const colId of board.columnOrder) {
      const col = columns[colId]
      if (!col) continue
      for (const cardId of col.cardIds) {
        const card = cards[cardId]
        if (card) result.push(card)
      }
    }
    return result
  }, [board, columns, cards])

  // Apply filters
  const filteredCards = useMemo(() => {
    let result = allCards
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter((c) => c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q))
    }
    if (labelIds.length > 0) {
      result = result.filter((c) => c.labels.some((l) => labelIds.includes(l.id)))
    }
    if (priorities.length > 0) {
      result = result.filter((c) => priorities.includes(c.priority))
    }
    if (showOverdueOnly) {
      result = result.filter((c) => getDueDateStatus(c.dueDate) === 'overdue')
    }
    return result
  }, [allCards, searchQuery, labelIds, priorities, showOverdueOnly])

  // Sort
  const sortedCards = useMemo(() => {
    const sorted = [...filteredCards].sort((a, b) => {
      let cmp = 0
      switch (sortKey) {
        case 'title':
          cmp = a.title.localeCompare(b.title)
          break
        case 'column': {
          const colA = columns[a.columnId]?.title ?? ''
          const colB = columns[b.columnId]?.title ?? ''
          cmp = colA.localeCompare(colB)
          break
        }
        case 'priority':
          cmp = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
          break
        case 'dueDate': {
          const da = a.dueDate ?? ''
          const db = b.dueDate ?? ''
          cmp = da.localeCompare(db)
          break
        }
        case 'subtasks': {
          const pa = a.subtasks.length ? a.subtasks.filter((s) => s.completed).length / a.subtasks.length : -1
          const pb = b.subtasks.length ? b.subtasks.filter((s) => s.completed).length / b.subtasks.length : -1
          cmp = pa - pb
          break
        }
        case 'completed':
          cmp = (a.completed ? 1 : 0) - (b.completed ? 1 : 0)
          break
      }
      return sortDir === 'asc' ? cmp : -cmp
    })
    return sorted
  }, [filteredCards, sortKey, sortDir, columns])

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ArrowUpDown size={12} className="opacity-30" />
    return sortDir === 'asc'
      ? <ArrowUp size={12} className="text-accent" />
      : <ArrowDown size={12} className="text-accent" />
  }

  if (sortedCards.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-content-tertiary text-sm">
        {t('tableView.noCards' as any)}
      </div>
    )
  }

  const gridCols = 'grid-cols-[minmax(120px,3fr)_minmax(80px,2fr)_minmax(70px,1.5fr)_minmax(80px,1.5fr)_minmax(100px,2fr)_minmax(60px,1fr)_minmax(50px,0.8fr)]'
  const headerCn = 'flex items-center gap-1 px-3 py-2 text-xs font-semibold text-content-secondary uppercase tracking-wider cursor-pointer hover:text-content-primary transition-colors select-none'

  return (
    <div className="flex-1 overflow-auto p-4">
      <div className="min-w-[700px] rounded-lg border border-border overflow-hidden">
        {/* Header */}
        <div className={cn('grid bg-surface-secondary border-b border-border', gridCols)}>
          <div className={headerCn} onClick={() => toggleSort('title')}>
            {t('tableView.title' as any)} <SortIcon col="title" />
          </div>
          <div className={headerCn} onClick={() => toggleSort('column')}>
            {t('tableView.column' as any)} <SortIcon col="column" />
          </div>
          <div className={headerCn} onClick={() => toggleSort('priority')}>
            {t('tableView.priority' as any)} <SortIcon col="priority" />
          </div>
          <div className={headerCn} onClick={() => toggleSort('dueDate')}>
            {t('tableView.dueDate' as any)} <SortIcon col="dueDate" />
          </div>
          <div className={cn(headerCn, 'cursor-default hover:text-content-secondary')}>
            {t('tableView.labels' as any)}
          </div>
          <div className={headerCn} onClick={() => toggleSort('subtasks')}>
            {t('tableView.subtasks' as any)} <SortIcon col="subtasks" />
          </div>
          <div className={headerCn} onClick={() => toggleSort('completed')}>
            {t('tableView.completed' as any)} <SortIcon col="completed" />
          </div>
        </div>

        {/* Rows */}
        {sortedCards.map((card) => {
          const col = columns[card.columnId]
          const dueDateStatus = getDueDateStatus(card.dueDate)
          const completedSubs = card.subtasks.filter((s) => s.completed).length
          return (
            <div
              key={card.id}
              className={cn('grid border-b border-border last:border-b-0 hover:bg-surface-secondary/50 transition-colors cursor-pointer', gridCols)}
              onClick={() => setActiveCardId(card.id)}
            >
              <div className={cn('px-3 py-2 text-sm text-content-primary truncate flex items-center gap-1.5', card.completed && 'line-through text-content-tertiary')}>
                {card.pinned && <Pin size={11} className="text-accent -rotate-45 shrink-0" />}
                {card.title}
                {(card.attachments?.length ?? 0) > 0 && (
                  <span className="flex items-center gap-0.5 text-content-tertiary shrink-0">
                    <Paperclip size={10} />
                    <span className="text-[10px]">{card.attachments!.length}</span>
                  </span>
                )}
              </div>
              <div className="px-3 py-2 text-xs text-content-secondary truncate">
                {col?.title}
              </div>
              <div className="px-3 py-2" onClick={(e) => {
                e.stopPropagation()
                const keys: Priority[] = ['none', 'low', 'medium', 'high', 'urgent']
                const idx = keys.indexOf(card.priority)
                updateCard(card.id, { priority: keys[(idx + 1) % keys.length] })
              }}>
                {card.priority !== 'none' ? (
                  <span className={cn('text-xs px-1.5 py-0.5 rounded cursor-pointer hover:opacity-80 transition-opacity', PRIORITY_CONFIG[card.priority].color, PRIORITY_CONFIG[card.priority].bgColor)}>
                    {t(`priority.${card.priority}` as any)}
                  </span>
                ) : (
                  <span className="text-xs text-content-tertiary/40 cursor-pointer hover:text-content-tertiary">—</span>
                )}
              </div>
              <div className="px-3 py-2">
                {card.dueDate && (
                  <span className={cn(
                    'text-xs',
                    dueDateStatus === 'overdue' && 'text-red-500',
                    dueDateStatus === 'due-today' && 'text-yellow-500',
                    dueDateStatus === 'due-tomorrow' && 'text-blue-500',
                    dueDateStatus === 'upcoming' && 'text-content-tertiary'
                  )}>
                    {formatDueDate(card.dueDate)}
                  </span>
                )}
              </div>
              <div className="px-3 py-2 flex flex-wrap gap-0.5 items-center">
                {card.labels.slice(0, 3).map((l) => (
                  <span key={l.id} className="text-[10px] px-1 rounded" style={{ backgroundColor: `${l.color}20`, color: l.color }}>
                    {l.emoji || ''}{l.name}
                  </span>
                ))}
                {card.labels.length > 3 && <span className="text-[10px] text-content-tertiary">+{card.labels.length - 3}</span>}
              </div>
              <div className="px-3 py-2 text-xs text-content-tertiary">
                {card.subtasks.length > 0 && `${completedSubs}/${card.subtasks.length}`}
              </div>
              <div className="px-3 py-2 flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                <Checkbox
                  checked={!!card.completed}
                  onChange={() => updateCard(card.id, { completed: !card.completed })}
                  size="sm"
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
