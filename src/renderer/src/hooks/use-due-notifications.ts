import { useEffect, useRef } from 'react'
import { useAppStore, useBoardStore } from '@/store'
import { useToastStore } from '@/store/toast-store'
import { isToday, isPast, parseISO, startOfDay, addHours } from 'date-fns'

function isRu(): boolean {
  return useAppStore.getState().language === 'ru'
}

export function useDueNotifications(): void {
  const notificationsEnabled = useAppStore((s) => s.notificationsEnabled)
  const notifyOverdue = useAppStore((s) => s.notifyOverdue)
  const notifyDueToday = useAppStore((s) => s.notifyDueToday)
  const notifyDueSoon = useAppStore((s) => s.notifyDueSoon)
  const notifyOnComplete = useAppStore((s) => s.notifyOnComplete)
  const notificationInterval = useAppStore((s) => s.notificationInterval)
  const cards = useBoardStore((s) => s.cards)
  const addToast = useToastStore((s) => s.addToast)
  const sentRef = useRef<string>('')
  const prevCompletedRef = useRef<Set<string>>(new Set())

  // Track newly completed cards
  useEffect(() => {
    if (!notificationsEnabled || !notifyOnComplete) {
      prevCompletedRef.current = new Set(
        Object.values(cards).filter((c) => c.completed).map((c) => c.id)
      )
      return
    }

    const currentCompleted = new Set(
      Object.values(cards).filter((c) => c.completed).map((c) => c.id)
    )

    for (const id of currentCompleted) {
      if (!prevCompletedRef.current.has(id)) {
        const card = cards[id]
        if (card) {
          addToast(isRu() ? `"${card.title}" выполнена` : `"${card.title}" completed`, 'success', 4000, { cardId: card.id, boardId: card.boardId })
        }
      }
    }

    prevCompletedRef.current = currentCompleted
  }, [notificationsEnabled, notifyOnComplete, cards, addToast])

  // Periodic checks for due dates — reads cards from store snapshot, NOT from dependency
  useEffect(() => {
    if (!notificationsEnabled) return

    const intervalMs = notificationInterval * 60 * 1000

    function check() {
      // Read current cards from store directly (not from stale closure)
      const currentCards = useBoardStore.getState().cards
      const allCards = Object.values(currentCards)
      let overdueCount = 0
      let dueTodayCount = 0
      let dueSoonCount = 0
      const now = new Date()
      const today = startOfDay(now)
      const soon = addHours(now, 24)

      for (const card of allCards) {
        if (!card.dueDate || card.completed) continue
        const date = parseISO(card.dueDate)
        if (isToday(date)) {
          dueTodayCount++
        } else if (isPast(date) && date < today) {
          overdueCount++
        } else if (date <= soon && date > today) {
          dueSoonCount++
        }
      }

      const key = `${overdueCount}-${dueTodayCount}-${dueSoonCount}`
      if (key === sentRef.current || (overdueCount === 0 && dueTodayCount === 0 && dueSoonCount === 0)) return
      sentRef.current = key

      const isFocused = document.hasFocus()
      const toast = useToastStore.getState().addToast

      const ru = isRu()
      if (notifyOverdue && overdueCount > 0) {
        const msg = ru ? `${overdueCount} карт. просрочено` : `${overdueCount} card(s) overdue`
        if (isFocused) {
          toast(msg, 'error', 6000)
        } else {
          window.electronAPI.showNotification('FlowZik', msg)
        }
      }
      if (notifyDueToday && dueTodayCount > 0) {
        const msg = ru ? `${dueTodayCount} карт. на сегодня` : `${dueTodayCount} card(s) due today`
        if (isFocused) {
          toast(msg, 'warning', 5000)
        } else {
          window.electronAPI.showNotification('FlowZik', msg)
        }
      }
      if (notifyDueSoon && dueSoonCount > 0) {
        const msg = ru ? `${dueSoonCount} карт. в ближайшие 24ч` : `${dueSoonCount} card(s) due within 24h`
        if (isFocused) {
          toast(msg, 'info', 5000)
        } else {
          window.electronAPI.showNotification('FlowZik', msg)
        }
      }
    }

    check()
    const interval = setInterval(check, intervalMs)
    return () => clearInterval(interval)
  }, [notificationsEnabled, notifyOverdue, notifyDueToday, notifyDueSoon, notificationInterval])
}
