import { useState } from 'react'
import { Plus, Trash2, Zap, ZapOff, ArrowRight, Pencil, X } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Toggle } from '@/components/ui/Checkbox'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useAutomationStore } from '@/store/automation-store'
import { useBoardStore, useAppStore } from '@/store'
import { useTranslation } from '@/hooks/use-translation'
import { cn } from '@/lib/utils'
import type { AutomationTrigger, AutomationAction, AutomationTriggerType, AutomationActionType, Priority } from '@/types'

interface AutomationsModalProps {
  open: boolean
  onClose: () => void
}

const TRIGGER_TYPES: { type: AutomationTriggerType; labelEn: string; labelRu: string; needsColumn?: boolean; needsPriority?: boolean; needsLabel?: boolean }[] = [
  { type: 'card_moved_to', labelEn: 'Card moved to column', labelRu: 'Карточка перемещена в колонку', needsColumn: true },
  { type: 'card_created', labelEn: 'Card created', labelRu: 'Карточка создана' },
  { type: 'card_completed', labelEn: 'Card marked complete', labelRu: 'Карточка отмечена как готовая' },
  { type: 'card_uncompleted', labelEn: 'Card marked incomplete', labelRu: 'Отметка готовности снята' },
  { type: 'priority_changed', labelEn: 'Priority changed to', labelRu: 'Приоритет изменён на', needsPriority: true },
  { type: 'due_date_overdue', labelEn: 'Due date is overdue', labelRu: 'Срок просрочен' },
  { type: 'label_added', labelEn: 'Label added', labelRu: 'Метка добавлена', needsLabel: true },
  { type: 'label_removed', labelEn: 'Label removed', labelRu: 'Метка удалена', needsLabel: true },
  { type: 'all_subtasks_completed', labelEn: 'All subtasks completed', labelRu: 'Все подзадачи выполнены' },
  { type: 'due_date_set', labelEn: 'Due date set', labelRu: 'Установлен срок' },
]

const ACTION_TYPES: { type: AutomationActionType; labelEn: string; labelRu: string; needsPriority?: boolean; needsLabel?: boolean; needsColumn?: boolean; needsDays?: boolean }[] = [
  { type: 'set_priority', labelEn: 'Set priority', labelRu: 'Установить приоритет', needsPriority: true },
  { type: 'add_label', labelEn: 'Add label', labelRu: 'Добавить метку', needsLabel: true },
  { type: 'remove_label', labelEn: 'Remove label', labelRu: 'Удалить метку', needsLabel: true },
  { type: 'mark_completed', labelEn: 'Mark as completed', labelRu: 'Отметить как готовое' },
  { type: 'mark_uncompleted', labelEn: 'Mark as incomplete', labelRu: 'Снять отметку готовности' },
  { type: 'move_to_column', labelEn: 'Move to column', labelRu: 'Переместить в колонку', needsColumn: true },
  { type: 'set_due_date_days', labelEn: 'Set due date (days from now)', labelRu: 'Установить срок (дней)', needsDays: true },
  { type: 'clear_due_date', labelEn: 'Clear due date', labelRu: 'Очистить срок' },
]

const PRIORITIES: Priority[] = ['none', 'low', 'medium', 'high', 'urgent']

export function AutomationsModal({ open, onClose }: AutomationsModalProps) {
  const { t } = useTranslation()
  const lang = t('sidebar.boards') === 'Доски' ? 'ru' : 'en'
  const activeBoardId = useAppStore((s) => s.activeBoardId)
  const boards = useBoardStore((s) => s.boards)
  const columns = useBoardStore((s) => s.columns)
  const globalLabels = useBoardStore((s) => s.globalLabels)
  const automations = useAutomationStore((s) => s.automations)
  const createAutomation = useAutomationStore((s) => s.createAutomation)
  const updateAutomation = useAutomationStore((s) => s.updateAutomation)
  const deleteAutomation = useAutomationStore((s) => s.deleteAutomation)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const board = activeBoardId ? boards[activeBoardId] : null
  const boardColumns = board ? board.columnOrder.map((id) => columns[id]).filter(Boolean) : []
  const boardAutomations = automations.filter((a) => a.boardId === activeBoardId)

  if (!board || !activeBoardId) return null

  return (
    <Modal open={open} onClose={onClose} width="max-w-2xl" dataTutorial="automations-modal">
      <div className="p-6 overflow-y-auto max-h-[80vh]">
        {/* Header - fixed layout, Add button won't overlap close */}
        <div className="flex items-center gap-2 mb-4 pr-8">
          <Zap size={20} className="text-accent shrink-0" />
          <h2 className="text-lg font-bold text-content-primary">
            {lang === 'ru' ? 'Автоматизации' : 'Automations'}
          </h2>
          <span className="text-xs text-content-tertiary ml-1 shrink-0">
            {boardAutomations.length} {lang === 'ru' ? 'правил' : 'rules'}
          </span>
          <div className="flex-1" />
          {!creating && (
            <Button size="sm" onClick={() => setCreating(true)} className="shrink-0">
              <Plus size={14} /> {lang === 'ru' ? 'Добавить' : 'Add'}
            </Button>
          )}
        </div>

        <p className="text-xs text-content-tertiary mb-4">
          {lang === 'ru'
            ? 'Автоматизации выполняют действия при наступлении определённых событий.'
            : 'Automations execute actions when certain events occur.'}
        </p>

        {/* Automation list */}
        {boardAutomations.length === 0 && !creating ? (
          <div className="text-center py-8 text-content-tertiary text-sm">
            {lang === 'ru' ? 'Нет автоматизаций для этой доски' : 'No automations for this board'}
          </div>
        ) : (
          <div className="space-y-2">
            {boardAutomations.map((automation) => (
              editingId === automation.id ? (
                <AutomationEditor
                  key={automation.id}
                  automation={automation}
                  columns={boardColumns}
                  globalLabels={globalLabels}
                  lang={lang}
                  onSave={(name, trigger, actions) => {
                    updateAutomation(automation.id, { name, trigger, actions })
                    setEditingId(null)
                  }}
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                <AutomationItem
                  key={automation.id}
                  automation={automation}
                  columns={boardColumns}
                  globalLabels={globalLabels}
                  lang={lang}
                  onToggle={(enabled) => updateAutomation(automation.id, { enabled })}
                  onEdit={() => setEditingId(automation.id)}
                  onDelete={() => setDeleteId(automation.id)}
                />
              )
            ))}
          </div>
        )}

        {/* Create new */}
        {creating && (
          <AutomationEditor
            columns={boardColumns}
            globalLabels={globalLabels}
            lang={lang}
            onSave={(name, trigger, actions) => {
              createAutomation(activeBoardId, name, trigger, actions)
              setCreating(false)
            }}
            onCancel={() => setCreating(false)}
          />
        )}

        <ConfirmDialog
          open={!!deleteId}
          onClose={() => setDeleteId(null)}
          onConfirm={() => {
            if (deleteId) deleteAutomation(deleteId)
            setDeleteId(null)
          }}
          title={lang === 'ru' ? 'Удалить правило' : 'Delete rule'}
          message={lang === 'ru' ? 'Это действие необратимо.' : 'This action cannot be undone.'}
          confirmLabel={lang === 'ru' ? 'Удалить' : 'Delete'}
          danger
        />
      </div>
    </Modal>
  )
}

function AutomationItem({
  automation, columns, globalLabels, lang, onToggle, onEdit, onDelete
}: {
  automation: import('@/types').Automation
  columns: import('@/types').Column[]
  globalLabels: import('@/types').Label[]
  lang: string
  onToggle: (enabled: boolean) => void
  onEdit: () => void
  onDelete: () => void
}) {
  const trigger = automation.trigger
  const triggerDef = TRIGGER_TYPES.find((tt) => tt.type === trigger.type)
  const triggerLabel = lang === 'ru' ? triggerDef?.labelRu : triggerDef?.labelEn

  let triggerExtra = ''
  if (trigger.type === 'card_moved_to' && trigger.columnId) {
    const col = columns.find((c) => c.id === trigger.columnId)
    triggerExtra = col ? `"${col.title}"` : ''
  }
  if (trigger.type === 'priority_changed' && trigger.priority) {
    triggerExtra = `"${trigger.priority}"`
  }
  if ((trigger.type === 'label_added' || trigger.type === 'label_removed') && trigger.labelId) {
    const label = globalLabels.find((l) => l.id === trigger.labelId)
    triggerExtra = label ? `"${label.name}"` : ''
  }

  return (
    <div className={cn(
      'group flex items-center gap-3 p-3 rounded-lg border transition-colors',
      automation.enabled ? 'border-border bg-surface-secondary' : 'border-border/50 bg-surface-tertiary/30 opacity-60'
    )}>
      <div className={cn('p-1.5 rounded shrink-0', automation.enabled ? 'bg-accent/10 text-accent' : 'bg-surface-tertiary text-content-tertiary')}>
        {automation.enabled ? <Zap size={14} /> : <ZapOff size={14} />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-content-primary truncate">{automation.name}</div>
        <div className="flex items-center gap-1 text-[11px] text-content-tertiary mt-0.5 flex-wrap">
          <span className="text-accent">{triggerLabel}</span>
          {triggerExtra && <span className="font-medium text-content-secondary">{triggerExtra}</span>}
          <ArrowRight size={10} className="mx-0.5" />
          {automation.actions.map((action, i) => {
            const actionDef = ACTION_TYPES.find((at) => at.type === action.type)
            const actionLabel = lang === 'ru' ? actionDef?.labelRu : actionDef?.labelEn
            let extra = ''
            if (action.type === 'set_priority' && action.priority) extra = ` "${action.priority}"`
            if (action.type === 'move_to_column' && action.columnId) {
              const col = columns.find((c) => c.id === action.columnId)
              extra = col ? ` "${col.title}"` : ''
            }
            if ((action.type === 'add_label' || action.type === 'remove_label') && action.labelId) {
              const label = globalLabels.find((l) => l.id === action.labelId)
              extra = label ? ` "${label.name}"` : ''
            }
            if (action.type === 'set_due_date_days' && action.days != null) extra = ` +${action.days}d`
            return (
              <span key={i}>
                {i > 0 && <span className="mr-1">,</span>}
                <span className="text-content-secondary">{actionLabel}{extra}</span>
              </span>
            )
          })}
        </div>
      </div>
      <button onClick={onEdit} className="p-1 rounded text-content-tertiary hover:text-accent opacity-0 group-hover:opacity-100 transition-all shrink-0">
        <Pencil size={14} />
      </button>
      <Toggle checked={automation.enabled} onChange={onToggle} />
      <button onClick={onDelete} className="p-1 rounded text-content-tertiary hover:text-red-500 transition-colors shrink-0">
        <Trash2 size={14} />
      </button>
    </div>
  )
}

function AutomationEditor({
  automation, columns, globalLabels, lang, onSave, onCancel
}: {
  automation?: import('@/types').Automation
  columns: import('@/types').Column[]
  globalLabels: import('@/types').Label[]
  lang: string
  onSave: (name: string, trigger: AutomationTrigger, actions: AutomationAction[]) => void
  onCancel: () => void
}) {
  const isEdit = !!automation
  const [name, setName] = useState(automation?.name ?? '')
  const [triggerType, setTriggerType] = useState<AutomationTriggerType>(automation?.trigger.type ?? 'card_moved_to')
  const [triggerColumnId, setTriggerColumnId] = useState(automation?.trigger.columnId ?? columns[0]?.id ?? '')
  const [triggerPriority, setTriggerPriority] = useState<Priority>(automation?.trigger.priority ?? 'high')
  const [triggerLabelId, setTriggerLabelId] = useState(automation?.trigger.labelId ?? globalLabels[0]?.id ?? '')
  const [actions, setActions] = useState<AutomationAction[]>(automation?.actions ?? [{ type: 'mark_completed' }])

  const triggerDef = TRIGGER_TYPES.find((tt) => tt.type === triggerType)

  const addAction = () => {
    setActions([...actions, { type: 'mark_completed' }])
  }

  const updateAction = (idx: number, updates: Partial<AutomationAction>) => {
    setActions(actions.map((a, i) => i === idx ? { ...a, ...updates } as AutomationAction : a))
  }

  const removeAction = (idx: number) => {
    setActions(actions.filter((_, i) => i !== idx))
  }

  const handleSave = () => {
    const trigger: AutomationTrigger = { type: triggerType }
    if (triggerDef?.needsColumn) trigger.columnId = triggerColumnId
    if (triggerDef?.needsPriority) trigger.priority = triggerPriority
    if (triggerDef?.needsLabel) trigger.labelId = triggerLabelId
    const autoName = name.trim() || (lang === 'ru' ? 'Автоматизация' : 'Automation')
    onSave(autoName, trigger, actions)
  }

  const isValid = actions.length > 0

  return (
    <div className="mt-3 p-4 rounded-lg border-2 border-accent/30 bg-accent/5 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-content-primary">
          {isEdit
            ? (lang === 'ru' ? 'Редактирование' : 'Edit rule')
            : (lang === 'ru' ? 'Новое правило' : 'New rule')}
        </h3>
        <button onClick={onCancel} className="p-1 rounded text-content-tertiary hover:text-content-primary">
          <X size={14} />
        </button>
      </div>

      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={lang === 'ru' ? 'Название правила...' : 'Rule name...'}
        className="w-full px-3 py-2 rounded-lg bg-surface-secondary border border-border text-sm text-content-primary outline-none focus:border-accent"
      />

      {/* Trigger */}
      <div>
        <label className="text-xs font-medium text-content-tertiary uppercase tracking-wider mb-1.5 block">
          {lang === 'ru' ? 'Когда' : 'When'}
        </label>
        <div className="flex gap-2 flex-wrap">
          <select
            value={triggerType}
            onChange={(e) => setTriggerType(e.target.value as AutomationTriggerType)}
            className="flex-1 min-w-[180px] px-3 py-2 rounded-lg bg-surface-secondary border border-border text-sm text-content-primary outline-none focus:border-accent"
          >
            {TRIGGER_TYPES.map((tt) => (
              <option key={tt.type} value={tt.type}>
                {lang === 'ru' ? tt.labelRu : tt.labelEn}
              </option>
            ))}
          </select>
          {triggerDef?.needsColumn && (
            <select
              value={triggerColumnId}
              onChange={(e) => setTriggerColumnId(e.target.value)}
              className="px-3 py-2 rounded-lg bg-surface-secondary border border-border text-sm text-content-primary outline-none focus:border-accent"
            >
              {columns.map((col) => (
                <option key={col.id} value={col.id}>{col.title}</option>
              ))}
            </select>
          )}
          {triggerDef?.needsPriority && (
            <select
              value={triggerPriority}
              onChange={(e) => setTriggerPriority(e.target.value as Priority)}
              className="px-3 py-2 rounded-lg bg-surface-secondary border border-border text-sm text-content-primary outline-none focus:border-accent"
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          )}
          {triggerDef?.needsLabel && (
            <select
              value={triggerLabelId}
              onChange={(e) => setTriggerLabelId(e.target.value)}
              className="px-3 py-2 rounded-lg bg-surface-secondary border border-border text-sm text-content-primary outline-none focus:border-accent"
            >
              {globalLabels.map((label) => (
                <option key={label.id} value={label.id}>
                  {label.emoji ? `${label.emoji} ` : ''}{label.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Actions */}
      <div>
        <label className="text-xs font-medium text-content-tertiary uppercase tracking-wider mb-1.5 block">
          {lang === 'ru' ? 'Тогда' : 'Then'}
        </label>
        <div className="space-y-2">
          {actions.map((action, idx) => {
            const actionDef = ACTION_TYPES.find((at) => at.type === action.type)
            return (
              <div key={idx} className="flex gap-2 items-center flex-wrap">
                <select
                  value={action.type}
                  onChange={(e) => updateAction(idx, { type: e.target.value as AutomationActionType })}
                  className="flex-1 min-w-[160px] px-3 py-2 rounded-lg bg-surface-secondary border border-border text-sm text-content-primary outline-none focus:border-accent"
                >
                  {ACTION_TYPES.map((at) => (
                    <option key={at.type} value={at.type}>
                      {lang === 'ru' ? at.labelRu : at.labelEn}
                    </option>
                  ))}
                </select>
                {actionDef?.needsPriority && (
                  <select
                    value={action.priority || 'none'}
                    onChange={(e) => updateAction(idx, { priority: e.target.value as Priority })}
                    className="px-3 py-2 rounded-lg bg-surface-secondary border border-border text-sm text-content-primary outline-none focus:border-accent"
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                )}
                {actionDef?.needsColumn && (
                  <select
                    value={action.columnId || columns[0]?.id || ''}
                    onChange={(e) => updateAction(idx, { columnId: e.target.value })}
                    className="px-3 py-2 rounded-lg bg-surface-secondary border border-border text-sm text-content-primary outline-none focus:border-accent"
                  >
                    {columns.map((col) => (
                      <option key={col.id} value={col.id}>{col.title}</option>
                    ))}
                  </select>
                )}
                {actionDef?.needsLabel && (
                  <select
                    value={action.labelId || globalLabels[0]?.id || ''}
                    onChange={(e) => updateAction(idx, { labelId: e.target.value })}
                    className="px-3 py-2 rounded-lg bg-surface-secondary border border-border text-sm text-content-primary outline-none focus:border-accent"
                  >
                    {globalLabels.map((label) => (
                      <option key={label.id} value={label.id}>
                        {label.emoji ? `${label.emoji} ` : ''}{label.name}
                      </option>
                    ))}
                  </select>
                )}
                {actionDef?.needsDays && (
                  <input
                    type="number"
                    min={0}
                    max={365}
                    value={action.days ?? 7}
                    onChange={(e) => updateAction(idx, { days: parseInt(e.target.value) || 0 })}
                    className="w-20 px-3 py-2 rounded-lg bg-surface-secondary border border-border text-sm text-content-primary outline-none focus:border-accent"
                  />
                )}
                {actions.length > 1 && (
                  <button onClick={() => removeAction(idx)} className="p-1 rounded text-content-tertiary hover:text-red-500">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            )
          })}
          <button
            onClick={addAction}
            className="flex items-center gap-1 text-xs text-accent hover:text-accent/80 transition-colors"
          >
            <Plus size={12} /> {lang === 'ru' ? 'Ещё действие' : 'Add action'}
          </button>
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <Button size="sm" onClick={handleSave} disabled={!isValid}>
          {isEdit
            ? (lang === 'ru' ? 'Сохранить' : 'Save')
            : (lang === 'ru' ? 'Создать' : 'Create')}
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>
          {lang === 'ru' ? 'Отмена' : 'Cancel'}
        </Button>
      </div>
    </div>
  )
}
