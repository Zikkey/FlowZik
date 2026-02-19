import { useMemo } from 'react'
import {
  LayoutDashboard, CheckCircle2, Clock, AlertTriangle,
  TrendingUp, ListTodo, Layers, Plus, ArrowRight, CalendarClock
} from 'lucide-react'
import { useBoardStore, useAppStore } from '@/store'
import { useTranslation } from '@/hooks/use-translation'
import { PRIORITY_CONFIG } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { Card, Column } from '@/types'

function getDueDateStatus(dueDate: string | null): 'overdue' | 'today' | 'upcoming' | null {
  if (!dueDate) return null
  const now = new Date()
  const due = new Date(dueDate)
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate())
  if (dueDay < today) return 'overdue'
  if (dueDay.getTime() === today.getTime()) return 'today'
  return 'upcoming'
}

export function Dashboard() {
  const { t } = useTranslation()
  const lang = t('sidebar.boards') === 'Доски' ? 'ru' : 'en'
  const boards = useBoardStore((s) => s.boards)
  const columns = useBoardStore((s) => s.columns)
  const cards = useBoardStore((s) => s.cards)
  const boardOrder = useBoardStore((s) => s.boardOrder)
  const createBoard = useBoardStore((s) => s.createBoard)
  const setActiveBoardId = useAppStore((s) => s.setActiveBoardId)
  const setShowDashboard = useAppStore((s) => s.setShowDashboard)
  const setActiveCardId = useAppStore((s) => s.setActiveCardId)

  const allCards = useMemo(() => Object.values(cards), [cards])

  const stats = useMemo(() => {
    const total = allCards.length
    const completed = allCards.filter((c) => c.completed).length
    const overdue = allCards.filter((c) => getDueDateStatus(c.dueDate) === 'overdue' && !c.completed).length
    const dueToday = allCards.filter((c) => getDueDateStatus(c.dueDate) === 'today' && !c.completed).length
    const highPriority = allCards.filter((c) => (c.priority === 'high' || c.priority === 'urgent') && !c.completed).length

    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const createdThisWeek = allCards.filter((c) => new Date(c.createdAt) > weekAgo).length
    const completedThisWeek = allCards.filter((c) => c.completed && new Date(c.updatedAt) > weekAgo).length

    return { total, completed, overdue, dueToday, highPriority, createdThisWeek, completedThisWeek }
  }, [allCards])

  const overdueCards = useMemo(() =>
    allCards
      .filter((c) => getDueDateStatus(c.dueDate) === 'overdue' && !c.completed)
      .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
      .slice(0, 10),
    [allCards]
  )

  const dueTodayCards = useMemo(() =>
    allCards
      .filter((c) => getDueDateStatus(c.dueDate) === 'today' && !c.completed)
      .slice(0, 10),
    [allCards]
  )

  // Cards due within the next 7 days (tomorrow through 7 days from now)
  const upcomingCards = useMemo(() => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000)
    const weekLater = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
    return allCards
      .filter((c) => {
        if (!c.dueDate || c.completed) return false
        const dueDay = new Date(c.dueDate)
        return dueDay >= tomorrow && dueDay <= weekLater
      })
      .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
      .slice(0, 10)
  }, [allCards])

  const recentCards = useMemo(() =>
    allCards
      .filter((c) => !c.completed)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 8),
    [allCards]
  )

  const boardStats = useMemo(() =>
    boardOrder.map((id) => {
      const board = boards[id]
      if (!board) return null
      const boardCards = allCards.filter((c) => c.boardId === id)
      const total = boardCards.length
      const completed = boardCards.filter((c) => c.completed).length
      const overdue = boardCards.filter((c) => getDueDateStatus(c.dueDate) === 'overdue' && !c.completed).length
      const boardCols = board.columnOrder
        .map((cid) => columns[cid])
        .filter(Boolean) as Column[]
      return { id, title: board.title, total, completed, overdue, columns: boardCols }
    }).filter(Boolean) as { id: string; title: string; total: number; completed: number; overdue: number; columns: Column[] }[],
    [boardOrder, boards, allCards, columns]
  )

  const navigateToCard = (card: Card) => {
    setActiveBoardId(card.boardId)
    setActiveCardId(card.id)
    setShowDashboard(false)
  }

  const navigateToBoard = (boardId: string) => {
    setActiveBoardId(boardId)
    setShowDashboard(false)
  }

  const handleCreateBoard = () => {
    const id = createBoard(lang === 'ru' ? 'Новая доска' : 'New Board')
    setActiveBoardId(id)
    setShowDashboard(false)
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center">
              <LayoutDashboard size={18} className="text-accent" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-content-primary">
                {lang === 'ru' ? 'Обзор' : 'Dashboard'}
              </h1>
              <p className="text-xs text-content-tertiary">
                {lang === 'ru'
                  ? `${boardStats.length} ${boardStats.length === 1 ? 'доска' : 'досок'} · ${stats.total} задач`
                  : `${boardStats.length} board${boardStats.length !== 1 ? 's' : ''} · ${stats.total} cards`
                }
              </p>
            </div>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            icon={Layers}
            label={lang === 'ru' ? 'Всего задач' : 'Total cards'}
            value={stats.total}
            color="text-content-primary"
            bg="bg-surface-secondary"
          />
          <StatCard
            icon={CheckCircle2}
            label={lang === 'ru' ? 'Выполнено' : 'Completed'}
            value={stats.completed}
            sub={stats.total > 0 ? `${Math.round((stats.completed / stats.total) * 100)}%` : '0%'}
            color="text-green-500"
            bg="bg-green-500/5"
          />
          <StatCard
            icon={AlertTriangle}
            label={lang === 'ru' ? 'Просрочено' : 'Overdue'}
            value={stats.overdue}
            color="text-red-500"
            bg="bg-red-500/5"
          />
          <StatCard
            icon={TrendingUp}
            label={lang === 'ru' ? 'За неделю' : 'This week'}
            value={stats.createdThisWeek}
            sub={lang === 'ru' ? `+${stats.completedThisWeek} выполнено` : `+${stats.completedThisWeek} done`}
            color="text-accent"
            bg="bg-accent/5"
          />
        </div>

        {/* Overdue + Due Today + Upcoming — 3-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Overdue */}
          <div className="bg-surface-secondary border border-border rounded-xl p-4">
            <h2 className="text-sm font-semibold text-red-500 mb-3 flex items-center gap-2">
              <AlertTriangle size={14} />
              {lang === 'ru' ? 'Просроченные' : 'Overdue'}
              {overdueCards.length > 0 && (
                <span className="text-[10px] bg-red-500/10 text-red-500 px-1.5 py-0.5 rounded-full">{overdueCards.length}</span>
              )}
            </h2>
            <div className="space-y-1">
              {overdueCards.map((card) => (
                <CardRow key={card.id} card={card} boards={boards} onClick={() => navigateToCard(card)} />
              ))}
              {overdueCards.length === 0 && (
                <p className="text-xs text-content-tertiary text-center py-4">
                  {lang === 'ru' ? 'Нет просроченных' : 'No overdue cards'}
                </p>
              )}
            </div>
          </div>

          {/* Due today */}
          <div className="bg-surface-secondary border border-border rounded-xl p-4">
            <h2 className="text-sm font-semibold text-amber-500 mb-3 flex items-center gap-2">
              <Clock size={14} />
              {lang === 'ru' ? 'На сегодня' : 'Due today'}
              {dueTodayCards.length > 0 && (
                <span className="text-[10px] bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded-full">{dueTodayCards.length}</span>
              )}
            </h2>
            <div className="space-y-1">
              {dueTodayCards.map((card) => (
                <CardRow key={card.id} card={card} boards={boards} onClick={() => navigateToCard(card)} />
              ))}
              {dueTodayCards.length === 0 && (
                <p className="text-xs text-content-tertiary text-center py-4">
                  {lang === 'ru' ? 'Нет задач на сегодня' : 'No cards due today'}
                </p>
              )}
            </div>
          </div>

          {/* Upcoming 7 days */}
          <div className="bg-surface-secondary border border-border rounded-xl p-4">
            <h2 className="text-sm font-semibold text-blue-500 mb-3 flex items-center gap-2">
              <CalendarClock size={14} />
              {lang === 'ru' ? 'Ближайшие 7 дней' : 'Next 7 days'}
              {upcomingCards.length > 0 && (
                <span className="text-[10px] bg-blue-500/10 text-blue-500 px-1.5 py-0.5 rounded-full">{upcomingCards.length}</span>
              )}
            </h2>
            <div className="space-y-1">
              {upcomingCards.map((card) => (
                <CardRow key={card.id} card={card} boards={boards} onClick={() => navigateToCard(card)} showDueDate />
              ))}
              {upcomingCards.length === 0 && (
                <p className="text-xs text-content-tertiary text-center py-4">
                  {lang === 'ru' ? 'Нет задач на неделю' : 'No upcoming cards'}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Recent activity — full width */}
        <div className="bg-surface-secondary border border-border rounded-xl p-4">
          <h2 className="text-sm font-semibold text-content-primary mb-3 flex items-center gap-2">
            <ListTodo size={14} className="text-accent" />
            {lang === 'ru' ? 'Последние задачи' : 'Recent cards'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-0.5">
            {recentCards.map((card) => (
              <CardRow key={card.id} card={card} boards={boards} onClick={() => navigateToCard(card)} showDate />
            ))}
          </div>
          {recentCards.length === 0 && (
            <p className="text-xs text-content-tertiary text-center py-4">
              {lang === 'ru' ? 'Нет активных задач' : 'No active cards'}
            </p>
          )}
        </div>

        {/* Boards — at the bottom */}
        <div>
          <h2 className="text-sm font-semibold text-content-primary mb-3 flex items-center gap-2">
            <LayoutDashboard size={14} className="text-accent" />
            {lang === 'ru' ? 'Доски' : 'Boards'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {boardStats.map((b) => (
              <BoardPreviewCard
                key={b.id}
                board={b}
                cards={cards}
                lang={lang}
                onClick={() => navigateToBoard(b.id)}
              />
            ))}
            {/* Create new board card */}
            <button
              onClick={handleCreateBoard}
              className="flex flex-col items-center justify-center gap-2 p-6 rounded-xl border-2 border-dashed border-border hover:border-accent/50 hover:bg-accent/5 transition-all text-content-tertiary hover:text-accent min-h-[140px]"
            >
              <Plus size={20} />
              <span className="text-xs font-medium">
                {lang === 'ru' ? 'Новая доска' : 'New board'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, sub, color, bg }: {
  icon: typeof Layers; label: string; value: number; sub?: string; color: string; bg: string
}) {
  return (
    <div className={cn('border border-border rounded-xl p-4', bg)}>
      <div className="flex items-center gap-2 mb-2">
        <Icon size={16} className={color} />
        <span className="text-xs text-content-tertiary">{label}</span>
      </div>
      <div className={cn('text-2xl font-bold', color)}>{value}</div>
      {sub && <div className="text-[11px] text-content-tertiary mt-0.5">{sub}</div>}
    </div>
  )
}

/** Mini kanban preview for each board */
function BoardPreviewCard({ board, cards, lang, onClick }: {
  board: { id: string; title: string; total: number; completed: number; overdue: number; columns: Column[] }
  cards: Record<string, Card>
  lang: string
  onClick: () => void
}) {
  const pct = board.total > 0 ? Math.round((board.completed / board.total) * 100) : 0

  return (
    <button
      onClick={onClick}
      className="text-left bg-surface-secondary border border-border rounded-xl p-4 hover:border-accent/40 hover:shadow-lg hover:shadow-accent/5 transition-all group"
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 rounded-md bg-accent/10 flex items-center justify-center">
          <LayoutDashboard size={12} className="text-accent" />
        </div>
        <span className="text-sm font-semibold text-content-primary truncate flex-1">{board.title}</span>
        <ArrowRight size={14} className="text-content-tertiary opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      {/* Mini column preview */}
      <div className="flex gap-1 h-16 mb-3">
        {board.columns.slice(0, 6).map((col) => {
          const cardCount = col.cardIds.length
          const maxCards = 5
          return (
            <div key={col.id} className="flex-1 min-w-0 flex flex-col gap-0.5">
              <div
                className="h-1 rounded-full shrink-0"
                style={{ backgroundColor: col.color || 'rgb(var(--border-color))' }}
              />
              {Array.from({ length: Math.min(cardCount, maxCards) }).map((_, i) => {
                const cardId = col.cardIds[i]
                const card = cardId ? cards[cardId] : null
                const priorityColors: Record<string, string> = {
                  urgent: '#ef4444', high: '#f97316', medium: '#f59e0b'
                }
                const cardColor = card && priorityColors[card.priority]
                return (
                  <div
                    key={i}
                    className="h-2 rounded-sm"
                    style={{
                      backgroundColor: cardColor
                        ? `${cardColor}30`
                        : 'rgb(var(--border-color) / 0.4)'
                    }}
                  />
                )
              })}
              {cardCount > maxCards && (
                <div className="text-[8px] text-content-tertiary text-center">+{cardCount - maxCards}</div>
              )}
            </div>
          )
        })}
        {board.columns.length === 0 && (
          <div className="flex-1 flex items-center justify-center text-[10px] text-content-tertiary">
            {lang === 'ru' ? 'Пустая доска' : 'Empty board'}
          </div>
        )}
      </div>

      {/* Footer stats */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <div className="h-1.5 bg-surface-tertiary rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
        <span className="text-[10px] text-content-tertiary shrink-0">{pct}%</span>
        <span className="text-[10px] text-content-tertiary shrink-0">
          {board.total} {lang === 'ru' ? 'карт.' : 'cards'}
        </span>
        {board.overdue > 0 && (
          <span className="text-[10px] text-red-500 shrink-0">{board.overdue} !</span>
        )}
      </div>
    </button>
  )
}

function CardRow({ card, boards, onClick, showDate, showDueDate }: {
  card: Card
  boards: Record<string, { title: string }>
  onClick: () => void
  showDate?: boolean
  showDueDate?: boolean
}) {
  const boardName = boards[card.boardId]?.title ?? ''
  const priorityCfg = PRIORITY_CONFIG[card.priority]

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-surface-tertiary transition-colors text-left group"
    >
      {card.priority !== 'none' && (
        <span
          className="w-1.5 h-1.5 rounded-full shrink-0"
          style={{ backgroundColor: priorityCfg.borderColor }}
        />
      )}
      <span className="text-sm text-content-primary truncate flex-1">{card.title}</span>
      <span className="text-[10px] text-content-tertiary shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">{boardName}</span>
      {showDate && (
        <span className="text-[10px] text-content-tertiary shrink-0">
          {new Date(card.updatedAt).toLocaleDateString()}
        </span>
      )}
      {showDueDate && card.dueDate && (
        <span className="text-[10px] text-blue-500 shrink-0">
          {new Date(card.dueDate).toLocaleDateString()}
        </span>
      )}
      {!showDate && !showDueDate && card.dueDate && (
        <span className="text-[10px] text-red-500 shrink-0">
          {new Date(card.dueDate).toLocaleDateString()}
        </span>
      )}
    </button>
  )
}
