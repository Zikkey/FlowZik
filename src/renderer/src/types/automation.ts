import type { Priority } from './board'

export type AutomationTriggerType =
  | 'card_moved_to'
  | 'card_created'
  | 'card_completed'
  | 'card_uncompleted'
  | 'priority_changed'
  | 'due_date_overdue'
  | 'label_added'
  | 'label_removed'
  | 'all_subtasks_completed'
  | 'due_date_set'

export interface AutomationTrigger {
  type: AutomationTriggerType
  columnId?: string       // for card_moved_to
  priority?: Priority     // for priority_changed
  labelId?: string        // for label_added / label_removed
}

export type AutomationActionType =
  | 'set_priority'
  | 'add_label'
  | 'remove_label'
  | 'mark_completed'
  | 'mark_uncompleted'
  | 'move_to_column'
  | 'set_due_date_days'
  | 'clear_due_date'

export interface AutomationAction {
  type: AutomationActionType
  priority?: Priority     // for set_priority
  labelId?: string        // for add_label / remove_label
  columnId?: string       // for move_to_column
  days?: number           // for set_due_date_days (days from now)
}

export interface Automation {
  id: string
  boardId: string
  name: string
  enabled: boolean
  trigger: AutomationTrigger
  actions: AutomationAction[]
  createdAt: string
}
