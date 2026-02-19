import { isPast, parseISO, isToday, isTomorrow, format, formatDistanceToNow } from 'date-fns'

export type DueDateStatus = 'overdue' | 'due-today' | 'due-tomorrow' | 'upcoming' | null

export function getDueDateStatus(dueDate: string | null): DueDateStatus {
  if (!dueDate) return null
  const date = parseISO(dueDate)
  if (isToday(date)) return 'due-today'
  if (isPast(date)) return 'overdue'
  if (isTomorrow(date)) return 'due-tomorrow'
  return 'upcoming'
}

export function formatDueDate(dueDate: string): string {
  const date = parseISO(dueDate)
  if (isToday(date)) return 'Today'
  if (isTomorrow(date)) return 'Tomorrow'
  return format(date, 'MMM d')
}

export function formatTimestamp(iso: string): string {
  return formatDistanceToNow(parseISO(iso), { addSuffix: true })
}
