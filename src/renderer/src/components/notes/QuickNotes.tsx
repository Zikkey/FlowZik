import { useState, useRef, useCallback, useEffect } from 'react'
import { StickyNote, X, Plus, Clipboard, Trash2, Bold, Italic, List, Link, Eye, Edit3 } from 'lucide-react'
import { useNotesStore } from '@/store/notes-store'
import { useBoardStore, useAppStore } from '@/store'
import { useTranslation } from '@/hooks/use-translation'
import { MarkdownView } from '@/components/ui/MarkdownView'
import { cn } from '@/lib/utils'

export function QuickNotes({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation()
  const lang = t('sidebar.boards') === 'Доски' ? 'ru' : 'en'

  const notes = useNotesStore((s) => s.notes)
  const activeNoteId = useNotesStore((s) => s.activeNoteId)
  const content = useNotesStore((s) => s.content)
  const setContent = useNotesStore((s) => s.setContent)
  const addNote = useNotesStore((s) => s.addNote)
  const deleteNote = useNotesStore((s) => s.deleteNote)
  const setActiveNote = useNotesStore((s) => s.setActiveNote)
  const updateNote = useNotesStore((s) => s.updateNote)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; text: string } | null>(null)
  const [preview, setPreview] = useState(false)
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')

  const activeBoardId = useAppStore((s) => s.activeBoardId)
  const boards = useBoardStore((s) => s.boards)
  const columns = useBoardStore((s) => s.columns)
  const createCard = useBoardStore((s) => s.createCard)

  // Auto-create first note if empty
  useEffect(() => {
    if (open && notes.length === 0) {
      addNote(lang === 'ru' ? 'Заметка 1' : 'Note 1')
    }
  }, [open, notes.length, addNote, lang])

  // Close on Escape (not during tutorial)
  useEffect(() => {
    if (!open) return
    const handleKey = (e: KeyboardEvent) => {
      if (useAppStore.getState().showOnboarding) return
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    const textarea = textareaRef.current
    if (!textarea) return
    const selectedText = textarea.value.substring(textarea.selectionStart, textarea.selectionEnd).trim()
    if (!selectedText) return

    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY, text: selectedText })
  }, [])

  const handleCreateCard = useCallback((columnId: string) => {
    if (!contextMenu) return
    createCard(columnId, contextMenu.text)
    setContextMenu(null)
  }, [contextMenu, createCard])

  // Markdown toolbar insert helpers
  const insertMarkdown = useCallback((before: string, after: string = '') => {
    const textarea = textareaRef.current
    if (!textarea) return
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const text = textarea.value
    const selected = text.substring(start, end)
    const replacement = `${before}${selected || (lang === 'ru' ? 'текст' : 'text')}${after}`
    const newContent = text.substring(0, start) + replacement + text.substring(end)
    setContent(newContent)
    requestAnimationFrame(() => {
      textarea.focus()
      const cursorPos = start + before.length + (selected || (lang === 'ru' ? 'текст' : 'text')).length
      textarea.setSelectionRange(cursorPos, cursorPos)
    })
  }, [setContent, lang])

  const handleTitleSave = useCallback((noteId: string) => {
    if (editTitle.trim()) {
      updateNote(noteId, { title: editTitle.trim() })
    }
    setEditingTitleId(null)
  }, [editTitle, updateNote])

  // Get available columns from active board
  const boardColumns = activeBoardId && boards[activeBoardId]
    ? boards[activeBoardId].columnOrder.map((id) => columns[id]).filter(Boolean)
    : []

  // Word count
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0

  if (!open) return null

  const activeNote = notes.find((n) => n.id === activeNoteId)

  return (
    <>
      {/* Context menu backdrop */}
      {contextMenu && (
        <div
          className="fixed inset-0 z-[60]"
          onClick={() => setContextMenu(null)}
        />
      )}

      {/* Overlay backdrop */}
      <div
        data-tutorial="quick-notes"
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-start justify-center pt-[6vh]"
        onMouseDown={(e) => { if (e.target === e.currentTarget && !useAppStore.getState().showOnboarding) onClose() }}
      >
        {/* Modal container */}
        <div
          className="w-full max-w-2xl bg-surface-primary border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
          style={{ maxHeight: '80vh' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border shrink-0">
            <StickyNote size={18} className="text-amber-500 shrink-0" />
            <h2 className="text-base font-semibold text-content-primary flex-1">
              {lang === 'ru' ? 'Заметки' : 'Notes'}
            </h2>
            <span className="text-xs text-content-tertiary mr-2">Ctrl+N</span>
            <button
              onClick={() => { if (!useAppStore.getState().showOnboarding) onClose() }}
              className="p-1.5 rounded-lg text-content-tertiary hover:text-content-primary hover:bg-surface-tertiary transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Note tabs */}
          <div className="flex items-center gap-0.5 px-3 pt-2 pb-1 overflow-x-auto scrollbar-none border-b border-border shrink-0">
            {notes.map((note) => (
              <div
                key={note.id}
                className={cn(
                  'group flex items-center gap-1 px-3 py-1.5 rounded-t-lg text-xs cursor-pointer transition-colors shrink-0 max-w-[160px]',
                  note.id === activeNoteId
                    ? 'bg-surface-tertiary text-content-primary font-medium'
                    : 'text-content-tertiary hover:text-content-secondary hover:bg-surface-secondary'
                )}
                onClick={() => { setActiveNote(note.id); setPreview(false) }}
                onDoubleClick={() => { setEditingTitleId(note.id); setEditTitle(note.title || '') }}
              >
                {editingTitleId === note.id ? (
                  <input
                    autoFocus
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onBlur={() => handleTitleSave(note.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleTitleSave(note.id)
                      if (e.key === 'Escape') setEditingTitleId(null)
                    }}
                    className="w-full bg-transparent text-xs outline-none border-b border-accent"
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span className="truncate">{note.title || (lang === 'ru' ? 'Без названия' : 'Untitled')}</span>
                )}
                {notes.length > 1 && note.id === activeNoteId && (
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteNote(note.id) }}
                    className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-red-500/20 text-content-tertiary hover:text-red-400 transition-all shrink-0"
                  >
                    <X size={10} />
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={() => addNote(lang === 'ru' ? `Заметка ${notes.length + 1}` : `Note ${notes.length + 1}`)}
              className="p-1.5 rounded-lg text-content-tertiary hover:text-accent hover:bg-accent/10 transition-colors shrink-0"
              title={lang === 'ru' ? 'Новая заметка' : 'New note'}
            >
              <Plus size={12} />
            </button>
          </div>

          {/* Markdown toolbar */}
          <div className="flex items-center gap-0.5 px-3 py-1.5 border-b border-border shrink-0">
            <button
              onClick={() => insertMarkdown('**', '**')}
              className="p-1.5 rounded text-content-tertiary hover:text-content-primary hover:bg-surface-tertiary transition-colors"
              title={lang === 'ru' ? 'Жирный' : 'Bold'}
            >
              <Bold size={14} />
            </button>
            <button
              onClick={() => insertMarkdown('*', '*')}
              className="p-1.5 rounded text-content-tertiary hover:text-content-primary hover:bg-surface-tertiary transition-colors"
              title={lang === 'ru' ? 'Курсив' : 'Italic'}
            >
              <Italic size={14} />
            </button>
            <button
              onClick={() => insertMarkdown('- ', '')}
              className="p-1.5 rounded text-content-tertiary hover:text-content-primary hover:bg-surface-tertiary transition-colors"
              title={lang === 'ru' ? 'Список' : 'List'}
            >
              <List size={14} />
            </button>
            <button
              onClick={() => insertMarkdown('[', '](url)')}
              className="p-1.5 rounded text-content-tertiary hover:text-content-primary hover:bg-surface-tertiary transition-colors"
              title={lang === 'ru' ? 'Ссылка' : 'Link'}
            >
              <Link size={14} />
            </button>

            <div className="flex-1" />

            {/* Preview toggle */}
            <button
              onClick={() => setPreview(!preview)}
              className={cn(
                'flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors',
                preview
                  ? 'bg-accent/10 text-accent'
                  : 'text-content-tertiary hover:text-content-primary hover:bg-surface-tertiary'
              )}
              title={preview ? (lang === 'ru' ? 'Редактировать' : 'Edit') : (lang === 'ru' ? 'Предпросмотр' : 'Preview')}
            >
              {preview ? <Edit3 size={12} /> : <Eye size={12} />}
              {preview ? (lang === 'ru' ? 'Ред.' : 'Edit') : (lang === 'ru' ? 'Просмотр' : 'Preview')}
            </button>
          </div>

          {/* Tip */}
          <div className="px-4 py-2 bg-surface-secondary/50 border-b border-border shrink-0">
            <p className="text-xs text-content-tertiary">
              {lang === 'ru'
                ? 'Выделите текст → ПКМ → создать карточку. Двойной клик на вкладку — переименовать.'
                : 'Select text → right-click → create card. Double-click tab to rename.'}
            </p>
          </div>

          {/* Content area */}
          {preview ? (
            <div className="flex-1 overflow-y-auto p-5 prose prose-sm dark:prose-invert max-w-none">
              {content ? (
                <MarkdownView text={content} />
              ) : (
                <p className="text-content-tertiary italic text-sm">
                  {lang === 'ru' ? 'Пусто...' : 'Empty...'}
                </p>
              )}
            </div>
          ) : (
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onContextMenu={handleContextMenu}
              placeholder={lang === 'ru'
                ? 'Записывайте идеи, заметки, всё что угодно...'
                : 'Write ideas, notes, anything...'}
              className="flex-1 w-full p-5 bg-transparent text-content-primary placeholder:text-content-secondary resize-none outline-none min-h-[300px]"
              style={{ fontSize: '16px', lineHeight: '1.75' }}
              spellCheck={false}
            />
          )}

          {/* Footer */}
          <div className="px-4 py-2.5 border-t border-border flex items-center justify-between shrink-0">
            <span className="text-xs text-content-tertiary">
              {content.length} {lang === 'ru' ? 'симв.' : 'chars'} · {wordCount} {lang === 'ru' ? 'слов' : 'words'}
            </span>
            <div className="flex items-center gap-1">
              {activeNote && notes.length > 1 && (
                <button
                  onClick={() => deleteNote(activeNote.id)}
                  className="p-1 rounded text-content-tertiary hover:text-red-400 transition-colors"
                  title={lang === 'ru' ? 'Удалить заметку' : 'Delete note'}
                >
                  <Trash2 size={13} />
                </button>
              )}
              <button
                onClick={() => navigator.clipboard.writeText(content)}
                className="p-1 rounded text-content-tertiary hover:text-content-primary transition-colors"
                title={lang === 'ru' ? 'Копировать всё' : 'Copy all'}
              >
                <Clipboard size={13} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Context menu for creating cards */}
      {contextMenu && (
        <div
          className="fixed z-[70] bg-surface-elevated border border-border rounded-lg shadow-xl py-1 min-w-[200px]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <div className="px-3 py-1.5 text-[10px] font-semibold text-content-tertiary uppercase tracking-wider">
            {lang === 'ru' ? 'Создать карточку в' : 'Create card in'}
          </div>
          {boardColumns.length > 0 ? (
            boardColumns.map((col) => (
              <button
                key={col.id}
                onClick={() => handleCreateCard(col.id)}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-content-primary hover:bg-surface-tertiary transition-colors text-left"
              >
                <Plus size={12} className="text-accent" />
                {col.title}
              </button>
            ))
          ) : (
            <div className="px-3 py-2 text-xs text-content-tertiary">
              {lang === 'ru' ? 'Сначала выберите доску' : 'Select a board first'}
            </div>
          )}
        </div>
      )}
    </>
  )
}
