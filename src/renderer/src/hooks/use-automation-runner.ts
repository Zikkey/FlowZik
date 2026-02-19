import { useEffect, useRef } from 'react'
import { useBoardStore } from '@/store'
import { useAutomationStore } from '@/store/automation-store'
import type { Card } from '@/types'

/**
 * Subscribes to board-store changes and executes matching automations.
 * Mount once in App.tsx.
 */
export function useAutomationRunner() {
  const prevCards = useRef<Record<string, Card>>({})
  const prevColumns = useRef<Record<string, { cardIds: string[] }>>({})
  const isRunning = useRef(false)

  useEffect(() => {
    // Initialize refs
    const state = useBoardStore.getState()
    prevCards.current = { ...state.cards }
    prevColumns.current = Object.fromEntries(
      Object.entries(state.columns).map(([id, col]) => [id, { cardIds: [...col.cardIds] }])
    )

    const unsub = useBoardStore.subscribe((state) => {
      if (isRunning.current) return
      isRunning.current = true

      try {
        const automations = useAutomationStore.getState().automations.filter((a) => a.enabled)
        if (automations.length === 0) return

        const oldCards = prevCards.current
        const _oldColumns = prevColumns.current

        // Detect changes per card
        for (const [cardId, card] of Object.entries(state.cards)) {
          const oldCard = oldCards[cardId]
          const boardAutomations = automations.filter((a) => a.boardId === card.boardId)
          if (boardAutomations.length === 0) continue

          // New card created
          if (!oldCard) {
            runMatchingAutomations(boardAutomations, 'card_created', card, state)
            continue
          }

          // Card moved to different column
          if (card.columnId !== oldCard.columnId) {
            runMatchingAutomations(boardAutomations, 'card_moved_to', card, state, {
              toColumnId: card.columnId,
              fromColumnId: oldCard.columnId
            })
          }

          // Card completed
          if (card.completed && !oldCard.completed) {
            runMatchingAutomations(boardAutomations, 'card_completed', card, state)
          }

          // Card uncompleted
          if (!card.completed && oldCard.completed) {
            runMatchingAutomations(boardAutomations, 'card_uncompleted', card, state)
          }

          // Priority changed
          if (card.priority !== oldCard.priority) {
            runMatchingAutomations(boardAutomations, 'priority_changed', card, state, {
              priority: card.priority
            })
          }

          // Due date set (was empty, now has a value)
          if (card.dueDate && !oldCard.dueDate) {
            runMatchingAutomations(boardAutomations, 'due_date_set', card, state)
          }

          // Due date became overdue (date changed or was just set to a past date)
          if (card.dueDate && card.dueDate !== oldCard.dueDate) {
            const now = new Date()
            const due = new Date(card.dueDate)
            if (due < now) {
              const oldDue = oldCard.dueDate ? new Date(oldCard.dueDate) : null
              if (!oldDue || oldDue >= now) {
                runMatchingAutomations(boardAutomations, 'due_date_overdue', card, state)
              }
            }
          }

          // Label added
          const oldLabelIds = new Set(oldCard.labels.map((l) => l.id))
          for (const label of card.labels) {
            if (!oldLabelIds.has(label.id)) {
              runMatchingAutomations(boardAutomations, 'label_added', card, state, { labelId: label.id })
            }
          }

          // Label removed
          const newLabelIds = new Set(card.labels.map((l) => l.id))
          for (const label of oldCard.labels) {
            if (!newLabelIds.has(label.id)) {
              runMatchingAutomations(boardAutomations, 'label_removed', card, state, { labelId: label.id })
            }
          }

          // All subtasks completed
          if (card.subtasks.length > 0 && oldCard.subtasks.length > 0) {
            const allNowComplete = card.subtasks.every((s) => s.completed)
            const allPrevComplete = oldCard.subtasks.every((s) => s.completed)
            if (allNowComplete && !allPrevComplete) {
              runMatchingAutomations(boardAutomations, 'all_subtasks_completed', card, state)
            }
          }
        }

      } finally {
        // Use latest state (including changes made by automation actions)
        // instead of the closure state which may be stale
        const latest = useBoardStore.getState()
        prevCards.current = { ...latest.cards }
        prevColumns.current = Object.fromEntries(
          Object.entries(latest.columns).map(([id, col]) => [id, { cardIds: [...col.cardIds] }])
        )
        isRunning.current = false
      }
    })

    return unsub
  }, [])
}

function runMatchingAutomations(
  automations: ReturnType<typeof useAutomationStore.getState>['automations'],
  triggerType: string,
  card: Card,
  _state: ReturnType<typeof useBoardStore.getState>,
  context?: { toColumnId?: string; fromColumnId?: string; priority?: string; labelId?: string }
) {
  const { updateCard, moveCard, addLabelToCard, removeLabelFromCard } = useBoardStore.getState()
  const { globalLabels } = useBoardStore.getState()

  for (const automation of automations) {
    const trigger = automation.trigger
    if (trigger.type !== triggerType) continue

    // Check trigger conditions
    if (trigger.type === 'card_moved_to' && trigger.columnId && trigger.columnId !== context?.toColumnId) continue
    if (trigger.type === 'priority_changed' && trigger.priority && trigger.priority !== context?.priority) continue
    if (trigger.type === 'label_added' && trigger.labelId && trigger.labelId !== context?.labelId) continue
    if (trigger.type === 'label_removed' && trigger.labelId && trigger.labelId !== context?.labelId) continue

    // Execute actions
    for (const action of automation.actions) {
      switch (action.type) {
        case 'set_priority':
          if (action.priority) {
            updateCard(card.id, { priority: action.priority })
          }
          break
        case 'add_label':
          if (action.labelId) {
            const label = globalLabels.find((l) => l.id === action.labelId)
            if (label) addLabelToCard(card.id, label)
          }
          break
        case 'remove_label':
          if (action.labelId) {
            removeLabelFromCard(card.id, action.labelId)
          }
          break
        case 'mark_completed':
          updateCard(card.id, { completed: true })
          break
        case 'mark_uncompleted':
          updateCard(card.id, { completed: false })
          break
        case 'move_to_column': {
          const currentCard = useBoardStore.getState().cards[card.id]
          if (currentCard && action.columnId && action.columnId !== currentCard.columnId) {
            const targetCol = useBoardStore.getState().columns[action.columnId]
            if (targetCol) {
              moveCard(card.id, currentCard.columnId, action.columnId, targetCol.cardIds.length)
            }
          }
          break
        }
        case 'set_due_date_days':
          if (action.days !== undefined) {
            const date = new Date()
            date.setDate(date.getDate() + action.days)
            updateCard(card.id, { dueDate: date.toISOString() })
          }
          break
        case 'clear_due_date':
          updateCard(card.id, { dueDate: null })
          break
      }
    }
  }
}
