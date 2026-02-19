import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Type, AlignLeft, Tag, Flag, Calendar, CheckSquare, ListChecks,
  MessageSquare, Archive, Trash2, Plus, X, CheckCircle2, Pencil, FileText, Copy
} from 'lucide-react'
import { createId } from '@/lib/id'
import { useAppStore, useBoardStore, useArchiveStore, useTemplateStore } from '@/store'
import { useToastStore } from '@/store/toast-store'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Dropdown, DropdownItem } from '@/components/ui/Dropdown'
import { MarkdownView } from '@/components/ui/MarkdownView'
import { Checkbox } from '@/components/ui/Checkbox'
import { AttachmentSection } from './AttachmentSection'
import { PRIORITY_CONFIG, LABEL_COLORS } from '@/lib/constants'
import { EmojiPicker } from '@/components/ui/EmojiPicker'
import { getDueDateStatus, formatDueDate, formatTimestamp } from '@/lib/date'
import { useDebounce } from '@/hooks/use-debounce'
import { useTranslation } from '@/hooks/use-translation'
import { cn } from '@/lib/utils'
import type { Priority, Label } from '@/types'

export function CardDetailModal() {
  const { t } = useTranslation()
  const activeCardId = useAppStore((s) => s.activeCardId)
  const setActiveCardId = useAppStore((s) => s.setActiveCardId)
  const card = useBoardStore((s) => activeCardId ? s.cards[activeCardId] : null)
  const columns = useBoardStore((s) => s.columns)
  const globalLabels = useBoardStore((s) => s.globalLabels)
  const updateCard = useBoardStore((s) => s.updateCard)
  const deleteCard = useBoardStore((s) => s.deleteCard)
  const addSubtask = useBoardStore((s) => s.addSubtask)
  const toggleSubtask = useBoardStore((s) => s.toggleSubtask)
  const deleteSubtask = useBoardStore((s) => s.deleteSubtask)
  const addChecklist = useBoardStore((s) => s.addChecklist)
  const renameChecklist = useBoardStore((s) => s.renameChecklist)
  const deleteChecklist = useBoardStore((s) => s.deleteChecklist)
  const addChecklistItem = useBoardStore((s) => s.addChecklistItem)
  const toggleChecklistItem = useBoardStore((s) => s.toggleChecklistItem)
  const deleteChecklistItem = useBoardStore((s) => s.deleteChecklistItem)
  const addComment = useBoardStore((s) => s.addComment)
  const deleteComment = useBoardStore((s) => s.deleteComment)
  const addLabelToCard = useBoardStore((s) => s.addLabelToCard)
  const removeLabelFromCard = useBoardStore((s) => s.removeLabelFromCard)
  const createLabel = useBoardStore((s) => s.createLabel)
  const updateLabel = useBoardStore((s) => s.updateLabel)
  const deleteLabel = useBoardStore((s) => s.deleteLabel)
  const archiveCard = useArchiveStore((s) => s.archiveCard)
  const createCardTemplate = useTemplateStore((s) => s.createCardTemplate)
  const duplicateCard = useBoardStore((s) => s.duplicateCard)
  const addToast = useToastStore((s) => s.addToast)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [subtaskTitle, setSubtaskTitle] = useState('')
  const [checklistItemTitles, setChecklistItemTitles] = useState<Record<string, string>>({})
  const [newChecklistTitle, setNewChecklistTitle] = useState('')
  const [addingChecklist, setAddingChecklist] = useState(false)
  const [editingChecklistId, setEditingChecklistId] = useState<string | null>(null)
  const [editChecklistTitle, setEditChecklistTitle] = useState('')
  const [commentText, setCommentText] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [showLabelPicker, setShowLabelPicker] = useState(false)
  const [newLabelName, setNewLabelName] = useState('')
  const [newLabelColor, setNewLabelColor] = useState(LABEL_COLORS[0])
  const [newLabelEmoji, setNewLabelEmoji] = useState('')
  const [editingLabelId, setEditingLabelId] = useState<string | null>(null)
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null) // label id or 'new'
  const [descriptionEditing, setDescriptionEditing] = useState(false)
  const [modalDragOver, setModalDragOver] = useState(false)
  const descRef = useRef<HTMLTextAreaElement>(null)
  const addAttachment = useBoardStore((s) => s.addAttachment)
  const dragCounterRef = useRef(0)

  const debouncedTitle = useDebounce(title, 300)
  const debouncedDescription = useDebounce(description, 500)
  const debounceCardIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (card) {
      debounceCardIdRef.current = card.id
      setTitle(card.title)
      setDescription(card.description)
    }
    // Reset label picker state when card changes or modal reopens
    setShowLabelPicker(false)
    setEditingLabelId(null)
    setShowEmojiPicker(null)
    setNewLabelName('')
    setNewLabelEmoji('')
    setDescriptionEditing(false)
  }, [card?.id])

  useEffect(() => {
    if (card && debouncedTitle && debouncedTitle !== card.title && card.id === debounceCardIdRef.current) {
      updateCard(card.id, { title: debouncedTitle })
    }
  }, [debouncedTitle])

  useEffect(() => {
    if (card && debouncedDescription !== card.description && card.id === debounceCardIdRef.current) {
      updateCard(card.id, { description: debouncedDescription })
    }
  }, [debouncedDescription])

  const onClose = useCallback(() => setActiveCardId(null), [setActiveCardId])

  const handleModalDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setModalDragOver(false)
    dragCounterRef.current = 0
    if (!card) return
    const files = Array.from(e.dataTransfer.files)
    if (!files.length) return
    const imageExts = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg'])
    for (const file of files) {
      try {
        const name = file.name
        const ext = name.split('.').pop()?.toLowerCase() ?? ''
        const type = imageExts.has(ext) ? 'image' as const : 'file' as const
        const filePath = (file as any).path as string | undefined
        let destPath: string
        if (filePath) {
          // Electron provides file.path on dropped files — use copyAttachment (more reliable)
          const destFileName = `${createId()}-${name}`
          destPath = await window.electronAPI.copyAttachment(filePath, destFileName)
        } else {
          const buffer = await file.arrayBuffer()
          destPath = await window.electronAPI.saveDroppedFile(name, buffer)
        }
        addAttachment(card.id, { name, path: destPath, type, size: file.size })
      } catch (err) {
        console.error('Failed to add dropped file:', err)
      }
    }
  }, [card?.id, addAttachment])

  if (!card) return null

  const column = columns[card.columnId]
  const completedSubtasks = card.subtasks.filter((s) => s.completed).length
  const dueDateStatus = getDueDateStatus(card.dueDate)

  const handleAddSubtask = () => {
    if (subtaskTitle.trim()) {
      addSubtask(card.id, subtaskTitle.trim())
      setSubtaskTitle('')
    }
  }

  const handleAddComment = () => {
    if (commentText.trim()) {
      addComment(card.id, commentText.trim())
      setCommentText('')
    }
  }

  const handleArchive = () => {
    if (useAppStore.getState().showOnboarding) return
    archiveCard(card, column?.title ?? 'Unknown')
    deleteCard(card.id)
    onClose()
  }

  const handleDelete = () => {
    if (useAppStore.getState().showOnboarding) return
    deleteCard(card.id)
    onClose()
  }

  const handleCreateLabel = () => {
    if (newLabelName.trim()) {
      const id = createLabel(newLabelName.trim(), newLabelColor, newLabelEmoji || undefined)
      addLabelToCard(card.id, { id, name: newLabelName.trim(), color: newLabelColor, emoji: newLabelEmoji || undefined })
      setNewLabelName('')
      setNewLabelEmoji('')
    }
  }

  const priorityKeys: Priority[] = ['none', 'low', 'medium', 'high', 'urgent']

  return (
    <>
      <Modal open={!!activeCardId} onClose={onClose} width="max-w-2xl" dataTutorial="card-detail">
        <div
          data-dropzone
          className="overflow-y-auto max-h-[80vh] p-6 space-y-6 relative"
          onDragEnter={(e) => { if (!e.dataTransfer.types.includes('Files')) return; e.preventDefault(); e.stopPropagation(); dragCounterRef.current++; setModalDragOver(true) }}
          onDragOver={(e) => { if (!e.dataTransfer.types.includes('Files')) return; e.preventDefault(); e.stopPropagation(); if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy' }}
          onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); dragCounterRef.current--; if (dragCounterRef.current <= 0) { setModalDragOver(false); dragCounterRef.current = 0 } }}
          onDrop={handleModalDrop}
        >
          {/* Drag overlay */}
          {modalDragOver && (
            <div className="absolute inset-0 z-50 bg-accent/10 border-2 border-dashed border-accent rounded-lg flex items-center justify-center pointer-events-none">
              <span className="text-accent font-medium text-sm">{t('cardDetail.dropFiles')}</span>
            </div>
          )}
          {/* Column name */}
          <div className="text-xs text-content-tertiary">
            {t('cardDetail.in')} <span className="font-medium text-content-secondary">{column?.title ?? 'Unknown'}</span>
          </div>

          {/* Title */}
          <div className="flex items-start gap-3">
            <Type size={18} className="text-content-tertiary mt-1 shrink-0" />
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="flex-1 text-xl font-bold bg-transparent text-content-primary outline-none border-b-2 border-transparent focus:border-accent pb-1"
              placeholder={t('cardDetail.cardTitle')}
            />
          </div>

          {/* Labels */}
          <div className="flex items-start gap-3">
            <Tag size={18} className="text-content-tertiary mt-1 shrink-0" />
            <div className="flex-1">
              <div className="flex flex-wrap gap-1.5 mb-2">
                {card.labels.map((label) => (
                  <Badge
                    key={label.id}
                    color={label.color}
                    emoji={label.emoji}
                    removable
                    onRemove={() => removeLabelFromCard(card.id, label.id)}
                  >
                    {label.name}
                  </Badge>
                ))}
                <button
                  onClick={() => setShowLabelPicker(!showLabelPicker)}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs text-content-tertiary hover:bg-surface-tertiary transition-colors"
                >
                  <Plus size={12} /> {t('cardDetail.addLabel')}
                </button>
              </div>
              {showLabelPicker && (
                <div className="p-2 rounded-lg bg-surface-tertiary border border-border space-y-1 animate-scale-in">
                  {globalLabels.map((label) => {
                    const isActive = card.labels.some((l) => l.id === label.id)
                    const isEditing = editingLabelId === label.id
                    return (
                      <div key={label.id} className="relative">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              if (isActive) removeLabelFromCard(card.id, label.id)
                              else addLabelToCard(card.id, label)
                            }}
                            className={cn(
                              'flex-1 flex items-center gap-2 px-2 py-1 rounded text-sm text-left transition-colors',
                              isActive ? 'bg-accent/10' : 'hover:bg-surface-secondary'
                            )}
                          >
                            {label.emoji ? (
                              <span className="text-sm">{label.emoji}</span>
                            ) : (
                              <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: label.color }} />
                            )}
                            <span className="text-content-primary">{label.name}</span>
                            {isActive && <span className="ml-auto text-accent text-xs">&#10003;</span>}
                          </button>
                          <button
                            onClick={() => setEditingLabelId(isEditing ? null : label.id)}
                            className="p-1 text-content-tertiary hover:text-content-primary rounded transition-colors"
                          >
                            <Pencil size={10} />
                          </button>
                        </div>
                        {isEditing && (
                          <div className="mt-1 p-2 rounded-lg bg-surface-elevated border border-border shadow-lg space-y-2" onClick={(e) => e.stopPropagation()}>
                            <input
                              value={label.name}
                              onChange={(e) => updateLabel(label.id, { name: e.target.value })}
                              className="w-full h-7 px-2 text-sm rounded bg-surface-tertiary text-content-primary outline-none border border-transparent focus:border-accent"
                              placeholder={t('cardDetail.labelName')}
                            />
                            <div className="flex items-center gap-2">
                              <div className="text-xs text-content-tertiary">{t('cardDetail.emoji')}</div>
                              <div className="relative">
                                <button
                                  onClick={() => setShowEmojiPicker(showEmojiPicker === label.id ? null : label.id)}
                                  className="w-8 h-8 rounded border border-border hover:border-border-hover text-base flex items-center justify-center transition-all"
                                >
                                  {label.emoji || '😀'}
                                </button>
                                {showEmojiPicker === label.id && (
                                  <div className="absolute top-full left-0 mt-1 z-50">
                                    <EmojiPicker
                                      selected={label.emoji}
                                      onSelect={(em) => { updateLabel(label.id, { emoji: em }); setShowEmojiPicker(null) }}
                                      onClear={() => { updateLabel(label.id, { emoji: undefined }); setShowEmojiPicker(null) }}
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {LABEL_COLORS.map((c) => (
                                <button
                                  key={c}
                                  onClick={() => updateLabel(label.id, { color: c })}
                                  className={cn(
                                    'w-5 h-5 rounded-full border-2 transition-all',
                                    label.color === c ? 'border-content-primary scale-110' : 'border-transparent'
                                  )}
                                  style={{ backgroundColor: c }}
                                />
                              ))}
                            </div>
                            <button
                              onClick={() => { deleteLabel(label.id); removeLabelFromCard(card.id, label.id); setEditingLabelId(null) }}
                              className="flex items-center gap-1 text-xs text-red-500 hover:text-red-400 transition-colors mt-1"
                            >
                              <Trash2 size={10} /> {t('common.delete')}
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  })}

                  {/* Create new label */}
                  <div className="pt-2 mt-2 border-t border-border space-y-2">
                    <div className="flex gap-1 items-center">
                      <div className="relative">
                        <button
                          onClick={() => setShowEmojiPicker(showEmojiPicker === 'new' ? null : 'new')}
                          className="w-8 h-7 text-center text-sm rounded bg-surface-secondary border border-transparent hover:border-border-hover transition-colors"
                        >
                          {newLabelEmoji || '😀'}
                        </button>
                        {showEmojiPicker === 'new' && (
                          <div className="absolute top-full left-0 mt-1 z-50">
                            <EmojiPicker
                              selected={newLabelEmoji}
                              onSelect={(em) => { setNewLabelEmoji(em); setShowEmojiPicker(null) }}
                              onClear={() => { setNewLabelEmoji(''); setShowEmojiPicker(null) }}
                            />
                          </div>
                        )}
                      </div>
                      <input
                        value={newLabelName}
                        onChange={(e) => setNewLabelName(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleCreateLabel() }}
                        className="flex-1 h-7 px-2 text-sm rounded bg-surface-secondary text-content-primary placeholder:text-content-tertiary outline-none border border-transparent focus:border-accent"
                        placeholder={t('cardDetail.labelName')}
                      />
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {LABEL_COLORS.map((c) => (
                        <button
                          key={c}
                          onClick={() => setNewLabelColor(c)}
                          className={cn(
                            'w-4 h-4 rounded-full border-2 transition-all',
                            newLabelColor === c ? 'border-content-primary scale-110' : 'border-transparent'
                          )}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                    <Button size="sm" variant="ghost" onClick={handleCreateLabel} disabled={!newLabelName.trim()}>
                      <Plus size={12} /> {t('cardDetail.addLabel')}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Priority & Due Date row */}
          <div className="flex gap-6">
            {/* Priority */}
            <div className="flex items-start gap-3">
              <Flag size={18} className="text-content-tertiary mt-1 shrink-0" />
              <Dropdown
                trigger={
                  <button className={cn(
                    'px-3 py-1 rounded-md text-sm border border-border hover:border-border-hover transition-colors',
                    PRIORITY_CONFIG[card.priority].color
                  )}>
                    {t(`priority.${card.priority}` as any)}
                  </button>
                }
              >
                {priorityKeys.map((p) => (
                  <DropdownItem
                    key={p}
                    onClick={() => updateCard(card.id, { priority: p })}
                    className={cn(card.priority === p && 'bg-surface-tertiary')}
                  >
                    <span className={cn('text-sm', PRIORITY_CONFIG[p].color)}>
                      {t(`priority.${p}` as any)}
                    </span>
                  </DropdownItem>
                ))}
              </Dropdown>
            </div>

            {/* Due Date */}
            <div className="flex items-start gap-3">
              <Calendar size={18} className="text-content-tertiary mt-1 shrink-0" />
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={card.dueDate?.split('T')[0] ?? ''}
                  onChange={(e) => updateCard(card.id, {
                    dueDate: e.target.value ? new Date(e.target.value).toISOString() : null
                  })}
                  className="px-3 py-1 rounded-md text-sm border border-border bg-transparent text-content-primary outline-none focus:border-accent"
                />
                {card.dueDate && (
                  <>
                    <span className={cn(
                      'text-xs px-2 py-0.5 rounded',
                      dueDateStatus === 'overdue' && 'bg-red-500/10 text-red-500',
                      dueDateStatus === 'due-today' && 'bg-yellow-500/10 text-yellow-500',
                      dueDateStatus === 'due-tomorrow' && 'bg-blue-500/10 text-blue-500',
                      dueDateStatus === 'upcoming' && 'text-content-tertiary'
                    )}>
                      {formatDueDate(card.dueDate)}
                    </span>
                    <button
                      onClick={() => updateCard(card.id, { dueDate: null })}
                      className="text-content-tertiary hover:text-content-primary"
                    >
                      <X size={12} />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="flex items-start gap-3">
            <AlignLeft size={18} className="text-content-tertiary mt-1 shrink-0" />
            <div className="flex-1">
              {descriptionEditing ? (
                <textarea
                  ref={descRef}
                  autoFocus
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  onBlur={() => setDescriptionEditing(false)}
                  onKeyDown={(e) => { if (e.key === 'Escape') setDescriptionEditing(false) }}
                  placeholder={t('cardDetail.addDescription')}
                  rows={6}
                  className="w-full px-3 py-2 rounded-lg bg-surface-tertiary text-sm text-content-primary placeholder:text-content-tertiary outline-none focus:ring-1 focus:ring-accent resize-y border border-transparent focus:border-accent"
                />
              ) : (
                <div
                  onClick={() => { setDescriptionEditing(true); setTimeout(() => descRef.current?.focus(), 50) }}
                  className="min-h-[60px] px-3 py-2 rounded-lg bg-surface-tertiary text-sm cursor-text border border-transparent hover:border-border-hover transition-colors"
                >
                  {description ? (
                    <MarkdownView text={description} className="text-content-primary" />
                  ) : (
                    <span className="text-content-tertiary">{t('cardDetail.editDescription' as any)}</span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Subtasks (legacy) */}
          <div className="flex items-start gap-3">
            <CheckSquare size={18} className="text-content-tertiary mt-1 shrink-0" />
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-content-primary">
                  {t('cardDetail.subtasks')}
                </span>
                {card.subtasks.length > 0 && (
                  <ProgressBar
                    value={completedSubtasks}
                    max={card.subtasks.length}
                    className="w-32"
                  />
                )}
              </div>
              <div className="space-y-1 mb-2">
                {card.subtasks.map((subtask) => (
                  <div key={subtask.id} className="group flex items-center gap-2 py-1 px-2 rounded hover:bg-surface-tertiary">
                    <Checkbox
                      checked={subtask.completed}
                      onChange={() => toggleSubtask(card.id, subtask.id)}
                      size="sm"
                    />
                    <span className={cn(
                      'flex-1 text-sm',
                      subtask.completed && 'line-through text-content-tertiary'
                    )}>
                      {subtask.title}
                    </span>
                    <button
                      onClick={() => deleteSubtask(card.id, subtask.id)}
                      className="opacity-0 group-hover:opacity-100 text-content-tertiary hover:text-red-500 transition-all"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  value={subtaskTitle}
                  onChange={(e) => setSubtaskTitle(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAddSubtask() }}
                  placeholder={t('cardDetail.addSubtask')}
                  className="flex-1 h-7 px-2 text-sm rounded bg-surface-tertiary text-content-primary placeholder:text-content-tertiary outline-none border border-transparent focus:border-accent"
                />
                <Button size="sm" variant="ghost" onClick={handleAddSubtask} disabled={!subtaskTitle.trim()}>
                  <Plus size={14} />
                </Button>
              </div>
            </div>
          </div>

          {/* Checklists (grouped) */}
          <div className="flex items-start gap-3">
            <ListChecks size={18} className="text-content-tertiary mt-1 shrink-0" />
            <div className="flex-1 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-content-primary">
                  {t('sidebar.boards') === 'Доски' ? 'Чек-листы' : 'Checklists'}
                </span>
                {!addingChecklist && (
                  <Button size="sm" variant="ghost" onClick={() => setAddingChecklist(true)}>
                    <Plus size={14} />
                  </Button>
                )}
              </div>

              {addingChecklist && (
                <div className="flex gap-2">
                  <input
                    autoFocus
                    value={newChecklistTitle}
                    onChange={(e) => setNewChecklistTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newChecklistTitle.trim()) {
                        addChecklist(card.id, newChecklistTitle.trim())
                        setNewChecklistTitle('')
                        setAddingChecklist(false)
                      }
                      if (e.key === 'Escape') { setAddingChecklist(false); setNewChecklistTitle('') }
                    }}
                    placeholder={t('sidebar.boards') === 'Доски' ? 'Название чек-листа...' : 'Checklist name...'}
                    className="flex-1 h-7 px-2 text-sm rounded bg-surface-tertiary text-content-primary placeholder:text-content-tertiary outline-none border border-transparent focus:border-accent"
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      if (newChecklistTitle.trim()) {
                        addChecklist(card.id, newChecklistTitle.trim())
                        setNewChecklistTitle('')
                        setAddingChecklist(false)
                      }
                    }}
                    disabled={!newChecklistTitle.trim()}
                  >
                    <Plus size={14} />
                  </Button>
                </div>
              )}

              {(card.checklists ?? []).map((checklist) => {
                const completed = checklist.items.filter((i) => i.completed).length
                const total = checklist.items.length
                const itemTitle = checklistItemTitles[checklist.id] ?? ''

                return (
                  <div key={checklist.id} className="bg-surface-tertiary/30 rounded-lg p-3">
                    {/* Checklist header */}
                    <div className="flex items-center justify-between mb-2">
                      {editingChecklistId === checklist.id ? (
                        <input
                          autoFocus
                          value={editChecklistTitle}
                          onChange={(e) => setEditChecklistTitle(e.target.value)}
                          onBlur={() => {
                            if (editChecklistTitle.trim()) renameChecklist(card.id, checklist.id, editChecklistTitle.trim())
                            setEditingChecklistId(null)
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              if (editChecklistTitle.trim()) renameChecklist(card.id, checklist.id, editChecklistTitle.trim())
                              setEditingChecklistId(null)
                            }
                            if (e.key === 'Escape') setEditingChecklistId(null)
                          }}
                          className="flex-1 h-6 px-1 text-sm font-medium rounded bg-transparent text-content-primary outline-none border border-accent"
                        />
                      ) : (
                        <span
                          className="text-sm font-medium text-content-primary cursor-pointer hover:text-accent transition-colors"
                          onDoubleClick={() => { setEditingChecklistId(checklist.id); setEditChecklistTitle(checklist.title) }}
                        >
                          {checklist.title}
                        </span>
                      )}
                      <div className="flex items-center gap-2">
                        {total > 0 && (
                          <ProgressBar value={completed} max={total} className="w-20" />
                        )}
                        <button
                          onClick={() => deleteChecklist(card.id, checklist.id)}
                          className="text-content-tertiary hover:text-red-500 transition-colors p-0.5"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>

                    {/* Checklist items */}
                    <div className="space-y-1 mb-2">
                      {checklist.items.map((item) => (
                        <div key={item.id} className="group flex items-center gap-2 py-0.5 px-1 rounded hover:bg-surface-tertiary">
                          <Checkbox
                            checked={item.completed}
                            onChange={() => toggleChecklistItem(card.id, checklist.id, item.id)}
                            size="sm"
                          />
                          <span className={cn(
                            'flex-1 text-sm',
                            item.completed && 'line-through text-content-tertiary'
                          )}>
                            {item.title}
                          </span>
                          <button
                            onClick={() => deleteChecklistItem(card.id, checklist.id, item.id)}
                            className="opacity-0 group-hover:opacity-100 text-content-tertiary hover:text-red-500 transition-all"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Add item */}
                    <div className="flex gap-2">
                      <input
                        value={itemTitle}
                        onChange={(e) => setChecklistItemTitles((prev) => ({ ...prev, [checklist.id]: e.target.value }))}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && itemTitle.trim()) {
                            addChecklistItem(card.id, checklist.id, itemTitle.trim())
                            setChecklistItemTitles((prev) => ({ ...prev, [checklist.id]: '' }))
                          }
                        }}
                        placeholder={t('cardDetail.addSubtask')}
                        className="flex-1 h-7 px-2 text-xs rounded bg-surface-tertiary text-content-primary placeholder:text-content-tertiary outline-none border border-transparent focus:border-accent"
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          if (itemTitle.trim()) {
                            addChecklistItem(card.id, checklist.id, itemTitle.trim())
                            setChecklistItemTitles((prev) => ({ ...prev, [checklist.id]: '' }))
                          }
                        }}
                        disabled={!itemTitle.trim()}
                      >
                        <Plus size={12} />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Attachments */}
          <AttachmentSection
            card={card}
            label={t('cardDetail.attachments')}
            addLabel={t('cardDetail.addAttachment')}
            dropLabel={t('cardDetail.dropFiles')}
          />

          {/* Comments */}
          <div className="flex items-start gap-3">
            <MessageSquare size={18} className="text-content-tertiary mt-1 shrink-0" />
            <div className="flex-1">
              <span className="text-sm font-medium text-content-primary mb-2 block">
                {t('cardDetail.comments')}
              </span>
              <div className="space-y-2 mb-3">
                {card.comments.map((comment) => (
                  <div key={comment.id} className="group p-2 rounded-lg bg-surface-tertiary">
                    <MarkdownView text={comment.text} className="text-sm text-content-primary" />
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-content-tertiary">{formatTimestamp(comment.createdAt)}</span>
                      <button
                        onClick={() => deleteComment(card.id, comment.id)}
                        className="opacity-0 group-hover:opacity-100 text-xs text-content-tertiary hover:text-red-500 transition-all"
                      >
                        {t('common.delete')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleAddComment()
                  }}
                  placeholder={t('cardDetail.writeComment')}
                  rows={2}
                  className="flex-1 px-3 py-2 text-sm rounded-lg bg-surface-tertiary text-content-primary placeholder:text-content-tertiary outline-none border border-transparent focus:border-accent resize-none"
                />
              </div>
              {commentText.trim() && (
                <div className="flex justify-end mt-2">
                  <Button size="sm" variant="primary" onClick={handleAddComment}>
                    {t('cardDetail.addComment')}
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-4 border-t border-border">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => updateCard(card.id, { completed: !card.completed })}
              className={card.completed ? 'text-green-500' : ''}
            >
              <CheckCircle2 size={14} />
              {card.completed ? t('card.markUndone') : t('card.markDone')}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => { duplicateCard(card.id); addToast(t('toast.cardDuplicated' as any), 'success') }}>
              <Copy size={14} /> {t('cardDetail.duplicate' as any)}
            </Button>
            <Button variant="ghost" size="sm" onClick={handleArchive} disabled={useAppStore.getState().showOnboarding}>
              <Archive size={14} /> {t('cardDetail.archive')}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                createCardTemplate({
                  name: card.title,
                  description: card.description,
                  priority: card.priority,
                  labels: card.labels,
                  subtasks: card.subtasks.map((s) => s.title)
                })
              }}
            >
              <FileText size={14} /> {t('sidebar.boards') === 'Доски' ? 'Шаблон' : 'Template'}
            </Button>
            <div className="flex-1" />
            <Button variant="danger" size="sm" onClick={() => setDeleteConfirm(true)} disabled={useAppStore.getState().showOnboarding}>
              <Trash2 size={14} /> {t('cardDetail.delete')}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={deleteConfirm}
        onClose={() => setDeleteConfirm(false)}
        onConfirm={handleDelete}
        title={t('cardDetail.deleteTitle')}
        message={t('cardDetail.deleteMsg')}
        confirmLabel={t('common.delete')}
        danger
      />
    </>
  )
}
