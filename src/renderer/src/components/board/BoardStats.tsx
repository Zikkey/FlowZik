import { useMemo } from 'react'
import { useBoardStore } from '@/store'
import { Modal } from '@/components/ui/Modal'
import { useTranslation } from '@/hooks/use-translation'
import { PRIORITY_CONFIG } from '@/lib/constants'
import { getDueDateStatus } from '@/lib/date'
import { cn } from '@/lib/utils'
import { subDays, isAfter, parseISO, startOfDay, format } from 'date-fns'
import type { Priority } from '@/types'

interface BoardStatsProps {
  boardId: string
  open: boolean
  onClose: () => void
}

export function BoardStats({ boardId, open, onClose }: BoardStatsProps) {
  const { t } = useTranslation()
  const boards = useBoardStore((s) => s.boards)
  const columns = useBoardStore((s) => s.columns)
  const cards = useBoardStore((s) => s.cards)

  const board = boards[boardId]

  const stats = useMemo(() => {
    if (!board) return null

    const allCards = board.columnOrder.flatMap((colId) => {
      const col = columns[colId]
      return col ? col.cardIds.map((cid) => cards[cid]).filter(Boolean) : []
    })

    const total = allCards.length
    const completed = allCards.filter((c) => c.completed).length
    const overdue = allCards.filter((c) => getDueDateStatus(c.dueDate) === 'overdue' && !c.completed).length

    // Cards per column
    const byColumn = board.columnOrder.map((colId) => {
      const col = columns[colId]
      return { name: col?.title ?? '?', count: col?.cardIds.length ?? 0 }
    })
    const maxByColumn = Math.max(...byColumn.map((c) => c.count), 1)

    // By priority
    const priorityKeys: Priority[] = ['none', 'low', 'medium', 'high', 'urgent']
    const byPriority = priorityKeys.map((p) => ({
      priority: p,
      count: allCards.filter((c) => c.priority === p).length
    }))
    const maxByPriority = Math.max(...byPriority.map((p) => p.count), 1)

    // Created last 7 days
    const today = startOfDay(new Date())
    const days: { label: string; count: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const day = subDays(today, i)
      const nextDay = subDays(today, i - 1)
      const count = allCards.filter((c) => {
        const created = parseISO(c.createdAt)
        return isAfter(created, day) && !isAfter(created, nextDay)
      }).length
      days.push({ label: format(day, 'dd.MM'), count })
    }
    const maxDays = Math.max(...days.map((d) => d.count), 1)

    return { total, completed, overdue, byColumn, maxByColumn, byPriority, maxByPriority, days, maxDays }
  }, [board, columns, cards])

  if (!stats) return null

  const completionPct = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0

  return (
    <Modal open={open} onClose={onClose} width="max-w-lg">
      <div className="p-6 overflow-y-auto max-h-[80vh] space-y-6">
        <h2 className="text-lg font-bold text-content-primary">{t('stats.title' as any)}</h2>

        {/* Summary row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-lg bg-surface-tertiary text-center">
            <div className="text-2xl font-bold text-content-primary">{stats.total}</div>
            <div className="text-xs text-content-tertiary">{t('stats.totalCards' as any)}</div>
          </div>
          <div className="p-3 rounded-lg bg-surface-tertiary text-center">
            <div className="text-2xl font-bold text-accent">{completionPct}%</div>
            <div className="text-xs text-content-tertiary">{t('stats.completionRate' as any)}</div>
          </div>
          <div className="p-3 rounded-lg bg-surface-tertiary text-center">
            <div className={cn('text-2xl font-bold', stats.overdue > 0 ? 'text-red-500' : 'text-content-primary')}>{stats.overdue}</div>
            <div className="text-xs text-content-tertiary">{t('stats.overdueCards' as any)}</div>
          </div>
        </div>

        {/* Completion circle */}
        <div className="flex justify-center">
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center"
            style={{
              background: `conic-gradient(rgb(var(--accent)) ${completionPct * 3.6}deg, rgb(var(--bg-tertiary)) 0deg)`
            }}
          >
            <div className="w-20 h-20 rounded-full bg-surface-elevated flex items-center justify-center">
              <span className="text-lg font-bold text-content-primary">{stats.completed}/{stats.total}</span>
            </div>
          </div>
        </div>

        {/* Cards by column */}
        <section>
          <h3 className="text-sm font-semibold text-content-secondary mb-3">{t('stats.cardsByColumn' as any)}</h3>
          <div className="space-y-2">
            {stats.byColumn.map((col, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-xs text-content-secondary w-24 truncate text-right">{col.name}</span>
                <div className="flex-1 h-5 bg-surface-tertiary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent rounded-full transition-all duration-300"
                    style={{ width: `${(col.count / stats.maxByColumn) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-content-tertiary w-6 text-right">{col.count}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Cards by priority */}
        <section>
          <h3 className="text-sm font-semibold text-content-secondary mb-3">{t('stats.cardsByPriority' as any)}</h3>
          <div className="space-y-2">
            {stats.byPriority.filter((p) => p.count > 0).map((p) => (
              <div key={p.priority} className="flex items-center gap-2">
                <span className={cn('text-xs w-16 text-right', PRIORITY_CONFIG[p.priority].color)}>
                  {t(`priority.${p.priority}` as any)}
                </span>
                <div className="flex-1 h-5 bg-surface-tertiary rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${(p.count / stats.maxByPriority) * 100}%`,
                      backgroundColor: PRIORITY_CONFIG[p.priority].borderColor === 'transparent'
                        ? 'rgb(var(--text-tertiary))'
                        : PRIORITY_CONFIG[p.priority].borderColor
                    }}
                  />
                </div>
                <span className="text-xs text-content-tertiary w-6 text-right">{p.count}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Created last 7 days */}
        <section>
          <h3 className="text-sm font-semibold text-content-secondary mb-3">{t('stats.createdLast7Days' as any)}</h3>
          <div className="flex items-end gap-1 h-24">
            {stats.days.map((day, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex-1 flex items-end">
                  <div
                    className="w-full bg-accent/70 rounded-t transition-all duration-300 min-h-[2px]"
                    style={{ height: `${(day.count / stats.maxDays) * 100}%` }}
                  />
                </div>
                <span className="text-[9px] text-content-tertiary">{day.label}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </Modal>
  )
}
