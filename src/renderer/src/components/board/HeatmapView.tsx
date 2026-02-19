import { useMemo } from 'react'
import { useAppStore, useBoardStore, useFilterStore } from '@/store'
import { useTranslation } from '@/hooks/use-translation'
import { cn } from '@/lib/utils'
import { differenceInDays, differenceInHours, parseISO } from 'date-fns'
import { getDueDateStatus } from '@/lib/date'
import type { Card } from '@/types'

function getHeatColor(hoursAgo: number): string {
  // Recent = hot (red/orange), old = cold (blue/gray)
  if (hoursAgo < 2) return '#ef4444'     // < 2h — red hot
  if (hoursAgo < 12) return '#f97316'    // < 12h — orange
  if (hoursAgo < 24) return '#eab308'    // < 1d — yellow
  if (hoursAgo < 72) return '#22c55e'    // < 3d — green
  if (hoursAgo < 168) return '#3b82f6'   // < 7d — blue
  if (hoursAgo < 720) return '#6366f1'   // < 30d — indigo
  return '#6b7280'                        // > 30d — gray cold
}

function getHeatLabel(hoursAgo: number, lang: string): string {
  if (hoursAgo < 1) return lang === 'ru' ? 'только что' : 'just now'
  if (hoursAgo < 24) return lang === 'ru' ? `${Math.floor(hoursAgo)}ч назад` : `${Math.floor(hoursAgo)}h ago`
  const days = Math.floor(hoursAgo / 24)
  if (days === 1) return lang === 'ru' ? 'вчера' : 'yesterday'
  if (days < 7) return lang === 'ru' ? `${days}д назад` : `${days}d ago`
  if (days < 30) return lang === 'ru' ? `${Math.floor(days / 7)}нед назад` : `${Math.floor(days / 7)}w ago`
  return lang === 'ru' ? `${Math.floor(days / 30)}мес назад` : `${Math.floor(days / 30)}mo ago`
}

export function HeatmapView() {
  const { t } = useTranslation()
  const lang = t('sidebar.boards') === 'Доски' ? 'ru' : 'en'
  const activeBoardId = useAppStore((s) => s.activeBoardId)
  const setActiveCardId = useAppStore((s) => s.setActiveCardId)
  const boards = useBoardStore((s) => s.boards)
  const columns = useBoardStore((s) => s.columns)
  const cards = useBoardStore((s) => s.cards)
  const searchQuery = useFilterStore((s) => s.searchQuery)
  const filterLabelIds = useFilterStore((s) => s.labelIds)
  const filterPriorities = useFilterStore((s) => s.priorities)
  const showOverdueOnly = useFilterStore((s) => s.showOverdueOnly)

  const board = activeBoardId ? boards[activeBoardId] : null

  const columnData = useMemo(() => {
    if (!board) return []
    const now = new Date()
    const q = searchQuery?.toLowerCase() ?? ''
    return board.columnOrder.map((colId) => {
      const col = columns[colId]
      if (!col) return null
      const colCards = col.cardIds.map((cid) => {
        const card = cards[cid]
        if (!card) return null
        if (q && !card.title.toLowerCase().includes(q) && !card.description.toLowerCase().includes(q)) return null
        if (filterLabelIds.length > 0 && !card.labels.some((l) => filterLabelIds.includes(l.id))) return null
        if (filterPriorities.length > 0 && !filterPriorities.includes(card.priority)) return null
        if (showOverdueOnly && getDueDateStatus(card.dueDate) !== 'overdue') return null
        const hoursAgo = differenceInHours(now, parseISO(card.updatedAt))
        return { card, hoursAgo, color: getHeatColor(hoursAgo) }
      }).filter(Boolean) as { card: Card; hoursAgo: number; color: string }[]
      return { col, cards: colCards }
    }).filter(Boolean) as { col: typeof columns[string]; cards: { card: Card; hoursAgo: number; color: string }[] }[]
  }, [board, columns, cards, searchQuery, filterLabelIds, filterPriorities, showOverdueOnly])

  if (!board) return null

  const legend = [
    { label: lang === 'ru' ? '< 2ч' : '< 2h', color: '#ef4444' },
    { label: lang === 'ru' ? '< 12ч' : '< 12h', color: '#f97316' },
    { label: lang === 'ru' ? '< 1д' : '< 1d', color: '#eab308' },
    { label: lang === 'ru' ? '< 3д' : '< 3d', color: '#22c55e' },
    { label: lang === 'ru' ? '< 7д' : '< 7d', color: '#3b82f6' },
    { label: lang === 'ru' ? '< 30д' : '< 30d', color: '#6366f1' },
    { label: lang === 'ru' ? '> 30д' : '> 30d', color: '#6b7280' },
  ]

  return (
    <div className="flex-1 overflow-auto p-4">
      {/* Legend */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <span className="text-xs text-content-tertiary font-medium">
          {lang === 'ru' ? 'Активность:' : 'Activity:'}
        </span>
        <div className="flex items-center gap-1">
          {legend.map((item) => (
            <div key={item.color} className="flex items-center gap-1">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: item.color }} />
              <span className="text-[10px] text-content-tertiary">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Heatmap grid */}
      <div className="flex gap-3 overflow-x-auto pb-4">
        {columnData.map(({ col, cards: colCards }) => (
          <div key={col.id} className="w-[220px] min-w-[220px] shrink-0">
            {/* Column header */}
            <div
              className="text-xs font-semibold text-content-secondary uppercase tracking-wider px-2 py-1.5 rounded-t-lg bg-surface-secondary border-b border-border truncate"
              style={col.color ? { borderBottomColor: col.color, borderBottomWidth: '2px' } : undefined}
            >
              {col.title} ({colCards.length})
            </div>

            {/* Cards heatmap */}
            <div className="space-y-1 py-2">
              {colCards.length === 0 ? (
                <div className="px-2 py-4 text-center text-xs text-content-tertiary">
                  {lang === 'ru' ? 'Нет карточек' : 'No cards'}
                </div>
              ) : (
                colCards.map(({ card, hoursAgo, color }) => (
                  <div
                    key={card.id}
                    onClick={() => setActiveCardId(card.id)}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer hover:brightness-110 transition-all group"
                    style={{ backgroundColor: `${color}15`, borderLeft: `3px solid ${color}` }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className={cn(
                        'text-xs text-content-primary truncate',
                        card.completed && 'line-through text-content-tertiary'
                      )}>
                        {card.title}
                      </div>
                      <div className="text-[10px] text-content-tertiary">
                        {getHeatLabel(hoursAgo, lang)}
                      </div>
                    </div>
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: color }}
                    />
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
