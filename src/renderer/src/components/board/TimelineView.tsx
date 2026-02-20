import { useMemo, useRef, useEffect, useState, useCallback } from 'react'
import { useAppStore, useBoardStore, useFilterStore } from '@/store'
import { useTranslation } from '@/hooks/use-translation'
import { getDueDateStatus } from '@/lib/date'
import { cn } from '@/lib/utils'
import {
  addDays, subDays, startOfDay, differenceInDays,
  format, parseISO, isBefore, isAfter, addMonths, subMonths
} from 'date-fns'
import { ru, enUS } from 'date-fns/locale'
import { PRIORITY_CONFIG } from '@/lib/constants'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import type { Card } from '@/types'

const DAY_WIDTH = 48
const ROW_HEIGHT = 36
const HEADER_HEIGHT = 56

export function TimelineView() {
  const { t } = useTranslation()
  const lang = t('sidebar.boards') === 'Доски' ? 'ru' : 'en'
  const locale = lang === 'ru' ? ru : enUS
  const activeBoardId = useAppStore((s) => s.activeBoardId)
  const setActiveCardId = useAppStore((s) => s.setActiveCardId)
  const boards = useBoardStore((s) => s.boards)
  const columns = useBoardStore((s) => s.columns)
  const cards = useBoardStore((s) => s.cards)
  const searchQuery = useFilterStore((s) => s.searchQuery)
  const filterLabelIds = useFilterStore((s) => s.labelIds)
  const filterPriorities = useFilterStore((s) => s.priorities)
  const showOverdueOnly = useFilterStore((s) => s.showOverdueOnly)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)

  // Navigation: center date for the visible range
  const [centerDate, setCenterDate] = useState(() => startOfDay(new Date()))

  const board = activeBoardId ? boards[activeBoardId] : null

  // Collect all cards with due dates, apply filters
  const timelineCards = useMemo(() => {
    if (!board) return []
    const q = searchQuery?.toLowerCase() ?? ''
    const result: { card: Card; colTitle: string; colColor?: string }[] = []
    for (const colId of board.columnOrder) {
      const col = columns[colId]
      if (!col) continue
      for (const cardId of col.cardIds) {
        const card = cards[cardId]
        if (!card || !card.dueDate) continue
        if (q && !(card.title ?? '').toLowerCase().includes(q) && !(card.description ?? '').toLowerCase().includes(q)) continue
        if (filterLabelIds.length > 0 && !(card.labels ?? []).some((l) => filterLabelIds.includes(l.id))) continue
        if (filterPriorities.length > 0 && !filterPriorities.includes(card.priority)) continue
        if (showOverdueOnly && getDueDateStatus(card.dueDate) !== 'overdue') continue
        result.push({ card, colTitle: col.title, colColor: col.color })
      }
    }
    result.sort((a, b) => a.card.dueDate!.localeCompare(b.card.dueDate!))
    return result
  }, [board, columns, cards, searchQuery, filterLabelIds, filterPriorities, showOverdueOnly])

  // Date range: 90 days centered around centerDate
  const { startDate, totalDays } = useMemo(() => {
    const start = subDays(centerDate, 30)
    return { startDate: start, totalDays: 90 }
  }, [centerDate])

  // Scroll to center on mount and when centerDate changes
  useEffect(() => {
    if (scrollRef.current) {
      const centerOffset = 30 // centerDate is 30 days from startDate
      scrollRef.current.scrollLeft = Math.max(0, centerOffset * DAY_WIDTH - scrollRef.current.clientWidth / 2)
    }
  }, [centerDate])

  const scrollToToday = useCallback(() => {
    setCenterDate(startOfDay(new Date()))
  }, [])

  const goBack = useCallback(() => {
    setCenterDate((d) => subMonths(d, 1))
  }, [])

  const goForward = useCallback(() => {
    setCenterDate((d) => addMonths(d, 1))
  }, [])

  // Generate day columns
  const days = useMemo(() => {
    const result: Date[] = []
    for (let i = 0; i <= totalDays; i++) {
      result.push(addDays(startDate, i))
    }
    return result
  }, [startDate, totalDays])

  // Convert vertical scroll to horizontal
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (scrollRef.current && e.deltaY !== 0) {
      e.preventDefault()
      scrollRef.current.scrollLeft += e.deltaY
    }
  }, [])

  const today = startOfDay(new Date())

  if (!board) return null

  const noCards = timelineCards.length === 0

  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border shrink-0 bg-surface-secondary">
        <Calendar size={16} className="text-content-tertiary" />
        <span className="text-sm font-medium text-content-primary">
          {lang === 'ru' ? 'Таймлайн' : 'Timeline'}
        </span>
        <span className="text-xs text-content-tertiary">
          {timelineCards.length} {lang === 'ru' ? 'карточек' : 'cards'}
        </span>
        <div className="flex-1" />
        <div className="flex items-center gap-0.5">
          <button
            onClick={goBack}
            className="p-1 rounded text-content-tertiary hover:text-content-primary hover:bg-surface-tertiary transition-colors"
            title={lang === 'ru' ? 'Назад на месяц' : 'Back one month'}
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={scrollToToday}
            className="flex items-center gap-1 px-2.5 py-1 text-xs rounded bg-accent/10 text-accent hover:bg-accent/20 transition-colors font-medium"
          >
            {lang === 'ru' ? 'Сегодня' : 'Today'}
          </button>
          <button
            onClick={goForward}
            className="p-1 rounded text-content-tertiary hover:text-content-primary hover:bg-surface-tertiary transition-colors"
            title={lang === 'ru' ? 'Вперёд на месяц' : 'Forward one month'}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {noCards ? (
        <div className="flex-1 flex items-center justify-center text-content-tertiary text-sm">
          {lang === 'ru' ? 'Нет карточек с датами дедлайна' : 'No cards with due dates'}
        </div>
      ) : (
        /* Full-width timeline — no left sidebar, card names are on the bars */
        <div ref={scrollRef} className="flex-1 overflow-auto" onWheel={handleWheel}>
          <div style={{ width: days.length * DAY_WIDTH, minHeight: '100%' }} className="relative">
            {/* Header: month + days */}
            <div className="sticky top-0 z-20 bg-surface-secondary border-b border-border" style={{ height: HEADER_HEIGHT }}>
              {/* Month row */}
              <div className="flex" style={{ height: 24 }}>
                {(() => {
                  const months: { label: string; startIdx: number; span: number }[] = []
                  let currentMonth = ''
                  let startIdx = 0
                  for (let i = 0; i < days.length; i++) {
                    const m = format(days[i], 'LLLL yyyy', { locale })
                    if (m !== currentMonth) {
                      if (currentMonth) months.push({ label: currentMonth, startIdx, span: i - startIdx })
                      currentMonth = m
                      startIdx = i
                    }
                  }
                  if (currentMonth) months.push({ label: currentMonth, startIdx, span: days.length - startIdx })
                  return months.map((m) => (
                    <div
                      key={m.startIdx}
                      className="text-[10px] font-semibold text-content-primary capitalize tracking-wide px-3 flex items-center border-r border-border"
                      style={{ width: m.span * DAY_WIDTH }}
                    >
                      {m.label}
                    </div>
                  ))
                })()}
              </div>
              {/* Day row */}
              <div className="flex" style={{ height: HEADER_HEIGHT - 24 }}>
                {days.map((day, i) => {
                  const isToday = differenceInDays(day, today) === 0
                  const isWeekend = day.getDay() === 0 || day.getDay() === 6
                  return (
                    <div
                      key={i}
                      className={cn(
                        'flex flex-col items-center justify-center border-r border-border/50',
                        isToday && 'bg-accent/15 font-bold',
                        isWeekend && !isToday && 'bg-surface-tertiary/40',
                        !isToday && !isWeekend && 'text-content-tertiary'
                      )}
                      style={{ width: DAY_WIDTH }}
                    >
                      <span className={cn('text-[9px] leading-none', isToday && 'text-accent')}>
                        {format(day, 'EEE', { locale }).slice(0, 2).toUpperCase()}
                      </span>
                      <span className={cn(
                        'text-[11px] font-medium mt-0.5 w-5 h-5 flex items-center justify-center rounded-full',
                        isToday && 'bg-accent text-white'
                      )}>
                        {format(day, 'd')}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Weekend column backgrounds */}
            {days.map((day, i) => {
              const isWeekend = day.getDay() === 0 || day.getDay() === 6
              if (!isWeekend) return null
              return (
                <div
                  key={`weekend-${i}`}
                  className="absolute bg-surface-tertiary/15 z-0"
                  style={{
                    left: i * DAY_WIDTH,
                    width: DAY_WIDTH,
                    top: HEADER_HEIGHT,
                    bottom: 0
                  }}
                />
              )
            })}

            {/* Today line */}
            {(() => {
              const todayIdx = differenceInDays(today, startDate)
              if (todayIdx >= 0 && todayIdx <= totalDays) {
                return (
                  <div
                    className="absolute top-0 bottom-0 z-10 pointer-events-none"
                    style={{ left: todayIdx * DAY_WIDTH + DAY_WIDTH / 2 - 1 }}
                  >
                    <div className="w-0.5 h-full bg-accent/50" />
                  </div>
                )
              }
              return null
            })()}

            {/* Card rows */}
            <div style={{ paddingTop: 4 }}>
              {timelineCards.map(({ card, colTitle, colColor }, rowIdx) => {
                const dueDate = parseISO(card.dueDate!)
                const dayOffset = differenceInDays(startOfDay(dueDate), startDate)
                const created = parseISO(card.createdAt)
                const createOffset = Math.max(0, differenceInDays(startOfDay(created), startDate))
                const barSpan = Math.max(1, dayOffset - createOffset)
                const barWidth = barSpan * DAY_WIDTH
                const barLeft = createOffset * DAY_WIDTH

                const isOverdue = isBefore(dueDate, today) && !card.completed
                const mainColor = colColor || PRIORITY_CONFIG[card.priority].borderColor || '#6366f1'

                return (
                  <div
                    key={card.id}
                    className={cn(
                      'relative',
                      hoveredCard === card.id && 'bg-accent/5'
                    )}
                    style={{ height: ROW_HEIGHT }}
                    onMouseEnter={() => setHoveredCard(card.id)}
                    onMouseLeave={() => setHoveredCard(null)}
                  >
                    {/* Alternating row bg */}
                    {rowIdx % 2 === 0 && (
                      <div className="absolute inset-0 bg-surface-tertiary/15 z-0" />
                    )}

                    {/* Horizontal grid line */}
                    <div className="absolute bottom-0 left-0 right-0 h-px bg-border/30" />

                    {/* Card bar */}
                    <div
                      className={cn(
                        'absolute top-1 rounded-md cursor-pointer flex items-center gap-1.5 px-2 overflow-hidden transition-all hover:shadow-lg hover:brightness-110 z-[5]',
                        card.completed && 'opacity-50'
                      )}
                      style={{
                        left: barLeft + 2,
                        width: Math.max(barWidth - 4, DAY_WIDTH - 4),
                        height: ROW_HEIGHT - 8,
                        backgroundColor: `${mainColor}25`,
                        borderLeft: `3px solid ${mainColor}`,
                        borderRadius: '6px'
                      }}
                      onClick={() => setActiveCardId(card.id)}
                      title={`${card.title}\n${colTitle} • ${format(dueDate, 'dd MMM yyyy', { locale })}`}
                    >
                      <span className={cn(
                        'text-[11px] font-medium text-content-primary truncate',
                        card.completed && 'line-through',
                        isOverdue && 'text-red-500'
                      )}>
                        {card.title}
                      </span>
                      {barWidth > DAY_WIDTH * 3 && (
                        <span className="text-[10px] text-content-tertiary shrink-0 ml-auto">
                          {format(dueDate, 'dd MMM', { locale })}
                        </span>
                      )}
                    </div>

                    {/* Due date marker diamond */}
                    <div
                      className={cn(
                        'absolute z-10 w-2.5 h-2.5 rotate-45 rounded-[2px]',
                        isOverdue ? 'bg-red-500' : card.completed ? 'bg-green-500' : 'bg-accent'
                      )}
                      style={{
                        left: dayOffset * DAY_WIDTH + DAY_WIDTH / 2 - 5,
                        top: ROW_HEIGHT / 2 - 5
                      }}
                    />
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
