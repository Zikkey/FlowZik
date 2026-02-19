import { memo } from 'react'
import { Calendar, Paperclip } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getDueDateStatus, formatDueDate } from '@/lib/date'
import type { Card } from '@/types'

interface CardBadgesProps {
  card: Card
}

export const CardBadges = memo(function CardBadges({ card }: CardBadgesProps) {
  const dueDateStatus = getDueDateStatus(card.dueDate)
  const attachmentCount = card.attachments?.length ?? 0

  const hasAny = card.labels.length > 0 || card.dueDate || attachmentCount > 0

  if (!hasAny) return null

  return (
    <div className="flex flex-wrap items-center gap-1.5 mt-2">
      {/* Labels with emoji support */}
      {card.labels.map((label) => (
        <span
          key={label.id}
          className="inline-flex items-center gap-1 text-xs px-1.5 py-0 rounded-full"
          style={{ backgroundColor: `${label.color}20`, color: label.color }}
          title={label.name}
        >
          {label.emoji ? (
            <span className="text-[10px]">{label.emoji}</span>
          ) : (
            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: label.color }} />
          )}
          <span className="truncate max-w-[60px] text-[10px] leading-tight">{label.name}</span>
        </span>
      ))}

      {/* Due date */}
      {card.dueDate && (
        <span
          className={cn(
            'flex items-center gap-1 text-xs px-1.5 py-0.5 rounded',
            dueDateStatus === 'overdue' && 'bg-red-500/10 text-red-500',
            dueDateStatus === 'due-today' && 'bg-yellow-500/10 text-yellow-500',
            dueDateStatus === 'due-tomorrow' && 'bg-blue-500/10 text-blue-500',
            dueDateStatus === 'upcoming' && 'text-content-tertiary'
          )}
        >
          <Calendar size={11} />
          {formatDueDate(card.dueDate)}
        </span>
      )}

      {/* Attachments count */}
      {attachmentCount > 0 && (
        <span className="flex items-center gap-1 text-xs text-content-tertiary">
          <Paperclip size={11} />
          {attachmentCount}
        </span>
      )}
    </div>
  )
})
