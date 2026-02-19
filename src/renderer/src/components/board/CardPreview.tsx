import { useEffect, useState, useRef } from 'react'
import { Calendar, Paperclip, ListTodo, MessageCircle, AlignLeft, CheckCircle2, Circle, CheckSquare, Square } from 'lucide-react'
import { PRIORITY_CONFIG } from '@/lib/constants'
import { useAppStore } from '@/store'
import { cn } from '@/lib/utils'
import type { Card } from '@/types'

interface CardPreviewProps {
  card: Card
  anchorRect: DOMRect
}

export function CardPreview({ card, anchorRect }: CardPreviewProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const isRu = useAppStore((s) => s.language) === 'ru'

  useEffect(() => {
    if (!ref.current) return
    const el = ref.current
    const pw = el.offsetWidth
    const ph = el.offsetHeight
    const vw = window.innerWidth
    const vh = window.innerHeight
    const gap = 8

    let x: number
    if (anchorRect.right + gap + pw < vw) {
      x = anchorRect.right + gap
    } else {
      x = anchorRect.left - gap - pw
    }

    let y = anchorRect.top
    if (y + ph > vh - 10) y = vh - ph - 10
    if (y < 10) y = 10

    setPos({ x, y })
  }, [anchorRect])

  const hasDueDate = !!card.dueDate
  const isOverdue = hasDueDate && new Date(card.dueDate!) < new Date()
  const checklists = card.checklists ?? []

  return (
    <div
      ref={ref}
      className="fixed z-[200] w-72 bg-surface-elevated border border-border rounded-xl shadow-2xl p-3 space-y-2.5 pointer-events-none animate-scale-in"
      style={{ left: pos.x, top: pos.y }}
    >
      {/* Priority + due date header */}
      <div className="flex items-center gap-2 flex-wrap">
        {card.priority !== 'none' && (
          <span
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold"
            style={{ color: PRIORITY_CONFIG[card.priority].borderColor, backgroundColor: `${PRIORITY_CONFIG[card.priority].borderColor}15` }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: PRIORITY_CONFIG[card.priority].borderColor }} />
            {isRu
              ? { low: 'Низкий', medium: 'Средний', high: 'Высокий', urgent: 'Срочный' }[card.priority]
              : card.priority.charAt(0).toUpperCase() + card.priority.slice(1)
            }
          </span>
        )}
        {hasDueDate && (
          <span className={cn('inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded', isOverdue ? 'text-red-500 bg-red-500/10' : 'text-content-tertiary bg-surface-tertiary')}>
            <Calendar size={10} />
            {new Date(card.dueDate!).toLocaleDateString()}
          </span>
        )}
        {card.completed && (
          <span className="inline-flex items-center gap-1 text-[10px] text-green-500 bg-green-500/10 px-1.5 py-0.5 rounded font-medium">
            <CheckCircle2 size={10} /> {isRu ? 'Готово' : 'Done'}
          </span>
        )}
      </div>

      {/* Title */}
      <p className={cn('text-sm font-medium text-content-primary leading-snug', card.completed && 'line-through opacity-60')}>
        {card.title}
      </p>

      {/* Description snippet */}
      {card.description && (
        <div className="flex items-start gap-1.5 text-xs text-content-tertiary">
          <AlignLeft size={11} className="shrink-0 mt-0.5" />
          <span className="line-clamp-3">{card.description}</span>
        </div>
      )}

      {/* Labels */}
      {card.labels.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {card.labels.slice(0, 6).map((l) => (
            <span
              key={l.id}
              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-medium text-white"
              style={{ backgroundColor: l.color }}
            >
              {l.emoji && <span>{l.emoji}</span>}
              {l.name}
            </span>
          ))}
          {card.labels.length > 6 && (
            <span className="text-[10px] text-content-tertiary self-center">+{card.labels.length - 6}</span>
          )}
        </div>
      )}

      {/* Subtasks list */}
      {card.subtasks.length > 0 && (
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold text-content-tertiary uppercase tracking-wider mb-1">
            <ListTodo size={10} />
            {isRu ? 'Подзадачи' : 'Subtasks'} {card.subtasks.filter((s) => s.completed).length}/{card.subtasks.length}
          </div>
          {card.subtasks.slice(0, 6).map((sub) => (
            <div key={sub.id} className="flex items-center gap-1.5 text-xs">
              {sub.completed
                ? <CheckCircle2 size={11} className="shrink-0 text-green-500" />
                : <Circle size={11} className="shrink-0 text-content-tertiary" />
              }
              <span className={cn('truncate', sub.completed ? 'line-through text-content-tertiary' : 'text-content-secondary')}>
                {sub.title}
              </span>
            </div>
          ))}
          {card.subtasks.length > 6 && (
            <span className="text-[10px] text-content-tertiary ml-4">+{card.subtasks.length - 6} {isRu ? 'ещё' : 'more'}</span>
          )}
        </div>
      )}

      {/* Checklists */}
      {checklists.length > 0 && checklists.map((cl) => (
        <div key={cl.id} className="space-y-0.5">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold text-content-tertiary uppercase tracking-wider mb-1">
            <CheckSquare size={10} />
            {cl.title} {cl.items.filter((i) => i.completed).length}/{cl.items.length}
          </div>
          {cl.items.slice(0, 4).map((item) => (
            <div key={item.id} className="flex items-center gap-1.5 text-xs">
              {item.completed
                ? <CheckSquare size={11} className="shrink-0 text-green-500" />
                : <Square size={11} className="shrink-0 text-content-tertiary" />
              }
              <span className={cn('truncate', item.completed ? 'line-through text-content-tertiary' : 'text-content-secondary')}>
                {item.title}
              </span>
            </div>
          ))}
          {cl.items.length > 4 && (
            <span className="text-[10px] text-content-tertiary ml-4">+{cl.items.length - 4} {isRu ? 'ещё' : 'more'}</span>
          )}
        </div>
      ))}

      {/* Footer meta */}
      <div className="flex flex-wrap items-center gap-2.5 text-[11px] text-content-tertiary pt-0.5 border-t border-border">
        {(card.attachments?.length ?? 0) > 0 && (
          <span className="flex items-center gap-1">
            <Paperclip size={10} />
            {card.attachments!.length}
          </span>
        )}
        {card.comments.length > 0 && (
          <span className="flex items-center gap-1">
            <MessageCircle size={10} />
            {card.comments.length}
          </span>
        )}
        {card.createdAt && (
          <span className="ml-auto text-[10px] text-content-tertiary/60">
            {new Date(card.createdAt).toLocaleDateString()}
          </span>
        )}
      </div>
    </div>
  )
}
