import { useState, useRef, useEffect } from 'react'
import { Plus, Flag, FileText } from 'lucide-react'
import { useAppStore, useBoardStore, useTemplateStore } from '@/store'
import { useTranslation } from '@/hooks/use-translation'
import { PRIORITY_CONFIG } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { Priority, Label } from '@/types'

interface AddCardButtonProps {
  columnId: string
}

export function AddCardButton({ columnId }: AddCardButtonProps) {
  const { t } = useTranslation()
  const [adding, setAdding] = useState(false)
  const [title, setTitle] = useState('')
  const [selectedLabels, setSelectedLabels] = useState<Label[]>([])
  const [selectedPriority, setSelectedPriority] = useState<Priority>('none')
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const createCard = useBoardStore((s) => s.createCard)
  const updateCard = useBoardStore((s) => s.updateCard)
  const addLabelToCard = useBoardStore((s) => s.addLabelToCard)
  const addSubtask = useBoardStore((s) => s.addSubtask)
  const globalLabels = useBoardStore((s) => s.globalLabels)
  const defaultPriority = useAppStore((s) => s.defaultPriority)
  const cardTemplates = useTemplateStore((s) => s.cardTemplates)
  const [showTemplates, setShowTemplates] = useState(false)

  useEffect(() => {
    if (adding && inputRef.current) {
      inputRef.current.focus()
      setSelectedPriority(defaultPriority)
    }
  }, [adding, defaultPriority])

  const handleSubmit = () => {
    if (title.trim()) {
      const cardId = createCard(columnId, title.trim())
      // Apply selected priority and labels
      if (selectedPriority !== 'none') {
        updateCard(cardId, { priority: selectedPriority })
      }
      for (const label of selectedLabels) {
        addLabelToCard(cardId, label)
      }
      setTitle('')
      setSelectedLabels([])
      setSelectedPriority(defaultPriority)
      inputRef.current?.focus()
    } else {
      setAdding(false)
      setTitle('')
      setSelectedLabels([])
      setSelectedPriority('none')
    }
  }

  const toggleLabel = (label: Label) => {
    setSelectedLabels((prev) =>
      prev.some((l) => l.id === label.id)
        ? prev.filter((l) => l.id !== label.id)
        : [...prev, label]
    )
  }

  const cyclePriority = () => {
    const keys: Priority[] = ['none', 'low', 'medium', 'high', 'urgent']
    const idx = keys.indexOf(selectedPriority)
    setSelectedPriority(keys[(idx + 1) % keys.length])
  }

  const handleCreateFromTemplate = (templateId: string) => {
    const template = cardTemplates.find((t) => t.id === templateId)
    if (!template) return
    const cardId = createCard(columnId, template.name)
    if (template.description) updateCard(cardId, { description: template.description })
    if (template.priority !== 'none') updateCard(cardId, { priority: template.priority })
    for (const label of template.labels) addLabelToCard(cardId, label)
    for (const sub of template.subtasks) addSubtask(cardId, sub)
    setShowTemplates(false)
  }

  if (!adding) {
    return (
      <div className="flex items-center gap-0.5">
        <button
          onClick={() => setAdding(true)}
          className="flex-1 flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-content-tertiary hover:bg-surface-tertiary hover:text-content-primary transition-colors"
        >
          <Plus size={14} /> {t('column.addCard')}
        </button>
        {cardTemplates.length > 0 && (
          <div className="relative">
            <button
              onClick={() => setShowTemplates(!showTemplates)}
              className="p-2 rounded-lg text-content-tertiary hover:bg-surface-tertiary hover:text-content-primary transition-colors"
              title={t('sidebar.boards') === 'Доски' ? 'Из шаблона' : 'From template'}
            >
              <FileText size={14} />
            </button>
            {showTemplates && (
              <div className="absolute bottom-full right-0 mb-1 w-48 bg-surface-elevated border border-border rounded-lg shadow-xl z-50 py-1">
                {cardTemplates.map((tmpl) => (
                  <button
                    key={tmpl.id}
                    onClick={() => handleCreateFromTemplate(tmpl.id)}
                    className="w-full text-left px-3 py-1.5 text-xs text-content-primary hover:bg-surface-tertiary transition-colors truncate"
                  >
                    {tmpl.name}
                    {tmpl.subtasks.length > 0 && (
                      <span className="text-content-tertiary ml-1">({tmpl.subtasks.length})</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="px-1 space-y-1.5">
      <textarea
        ref={inputRef}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSubmit()
          }
          if (e.key === 'Escape') {
            setAdding(false)
            setTitle('')
            setSelectedLabels([])
            setSelectedPriority('none')
          }
        }}
        onBlur={(e) => {
          // Don't submit on blur if clicking on label/priority buttons
          if (e.relatedTarget?.closest('.add-card-toolbar')) return
          handleSubmit()
        }}
        placeholder={t('card.enterTitle')}
        rows={2}
        className="w-full px-3 py-2 text-sm rounded-lg bg-surface-elevated border border-border text-content-primary placeholder:text-content-tertiary outline-none focus:border-accent resize-none"
      />
      {/* Quick toolbar */}
      <div className="add-card-toolbar flex items-center gap-1 flex-wrap">
        {/* Priority toggle */}
        <button
          onClick={cyclePriority}
          className={cn(
            'flex items-center gap-1 px-1.5 py-0.5 rounded text-xs border transition-colors',
            selectedPriority !== 'none'
              ? 'border-current'
              : 'border-border hover:border-border-hover text-content-tertiary',
            PRIORITY_CONFIG[selectedPriority].color
          )}
        >
          <Flag size={10} />
          {t(`priority.${selectedPriority}` as any)}
        </button>
        {/* Label chips */}
        {globalLabels.slice(0, 6).map((label) => {
          const isSelected = selectedLabels.some((l) => l.id === label.id)
          return (
            <button
              key={label.id}
              onClick={() => toggleLabel(label)}
              className={cn(
                'px-1.5 py-0.5 rounded text-xs transition-colors border',
                isSelected
                  ? 'border-current opacity-100'
                  : 'border-transparent opacity-60 hover:opacity-100'
              )}
              style={{ color: label.color, backgroundColor: `${label.color}15` }}
            >
              {label.emoji && <span className="mr-0.5">{label.emoji}</span>}
              {label.name}
            </button>
          )
        })}
      </div>
    </div>
  )
}
