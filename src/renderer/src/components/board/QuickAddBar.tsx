import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { Plus, ChevronDown } from 'lucide-react'
import { useAppStore, useBoardStore } from '@/store'
import { useToastStore } from '@/store/toast-store'
import { useTranslation } from '@/hooks/use-translation'
import { playClick } from '@/lib/sounds'
import { cn } from '@/lib/utils'

export function QuickAddBar() {
  const { t } = useTranslation()
  const lang = t('sidebar.boards') === 'Доски' ? 'ru' : 'en'

  const quickAddOpen = useAppStore((s) => s.quickAddOpen)
  const setQuickAddOpen = useAppStore((s) => s.setQuickAddOpen)
  const activeBoardId = useAppStore((s) => s.activeBoardId)
  const boards = useBoardStore((s) => s.boards)
  const columns = useBoardStore((s) => s.columns)
  const createCard = useBoardStore((s) => s.createCard)
  const addToast = useToastStore((s) => s.addToast)

  const [title, setTitle] = useState('')
  const [selectedColumnId, setSelectedColumnId] = useState<string | null>(null)
  const [showColumnPicker, setShowColumnPicker] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  const board = activeBoardId ? boards[activeBoardId] : null
  const boardColumns = useMemo(() => {
    if (!board) return []
    return board.columnOrder.map((id) => columns[id]).filter(Boolean)
  }, [board, columns])

  // Auto-select first column when board changes or opens
  useEffect(() => {
    if (quickAddOpen && boardColumns.length > 0 && !selectedColumnId) {
      setSelectedColumnId(boardColumns[0].id)
    }
  }, [quickAddOpen, boardColumns, selectedColumnId])

  // Focus input on open
  useEffect(() => {
    if (quickAddOpen) {
      setTitle('')
      setShowColumnPicker(false)
      if (boardColumns.length > 0) {
        setSelectedColumnId(boardColumns[0].id)
      }
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [quickAddOpen])

  const close = useCallback(() => {
    setQuickAddOpen(false)
    setTitle('')
    setShowColumnPicker(false)
  }, [setQuickAddOpen])

  const handleSubmit = useCallback(() => {
    const trimmed = title.trim()
    if (!trimmed || !selectedColumnId) return
    createCard(selectedColumnId, trimmed)
    playClick()
    addToast(lang === 'ru' ? 'Карточка создана' : 'Card created', 'success')
    setTitle('')
    inputRef.current?.focus()
  }, [title, selectedColumnId, createCard, addToast, lang])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    } else if (e.key === 'Escape') {
      close()
    }
  }, [handleSubmit, close, boardColumns, selectedColumnId])

  // Intercept Tab at the document level to prevent focus leaving the panel
  useEffect(() => {
    if (!quickAddOpen) return
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        e.preventDefault()
        e.stopPropagation()
        if (boardColumns.length > 1 && selectedColumnId) {
          const idx = boardColumns.findIndex((c) => c.id === selectedColumnId)
          const next = e.shiftKey
            ? (idx - 1 + boardColumns.length) % boardColumns.length
            : (idx + 1) % boardColumns.length
          setSelectedColumnId(boardColumns[next].id)
        }
      }
    }
    document.addEventListener('keydown', handleGlobalKeyDown, true)
    return () => document.removeEventListener('keydown', handleGlobalKeyDown, true)
  }, [quickAddOpen, boardColumns, selectedColumnId])

  if (!quickAddOpen) return null

  // No active board — show message
  if (!board || boardColumns.length === 0) {
    return (
      <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] px-4" onClick={close}>
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
        <div className="relative w-full max-w-lg bg-surface-elevated border border-border rounded-xl shadow-2xl overflow-hidden animate-scale-in p-6 text-center" onClick={(e) => e.stopPropagation()}>
          <p className="text-sm text-content-secondary">
            {lang === 'ru' ? 'Сначала откройте доску с колонками' : 'Open a board with columns first'}
          </p>
          <button onClick={close} className="mt-3 px-3 py-1 rounded-lg text-xs bg-surface-tertiary text-content-secondary hover:text-content-primary transition-colors">
            {lang === 'ru' ? 'Закрыть' : 'Close'}
          </button>
        </div>
      </div>
    )
  }

  const selectedColumn = selectedColumnId ? columns[selectedColumnId] : null

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] px-4" onClick={close}>
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
      <div
        ref={panelRef}
        className="relative w-full max-w-lg bg-surface-elevated border border-border rounded-xl shadow-2xl overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input row */}
        <div className="flex items-center gap-2 px-4">
          <Plus size={16} className="text-accent shrink-0" />
          <input
            ref={inputRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={lang === 'ru' ? 'Название карточки...' : 'Card title...'}
            className="flex-1 h-12 bg-transparent text-sm text-content-primary placeholder:text-content-tertiary outline-none"
          />
          <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] text-content-tertiary bg-surface-tertiary rounded border border-border">
            Ctrl+Q
          </kbd>
        </div>

        {/* Column selector + actions */}
        <div className="px-4 py-2.5 border-t border-border flex items-center gap-3">
          {/* Column picker */}
          <div className="relative">
            <button
              onClick={() => setShowColumnPicker(!showColumnPicker)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs border border-border hover:border-border-hover transition-colors bg-surface-secondary"
            >
              {selectedColumn?.color && (
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: selectedColumn.color }} />
              )}
              <span className="text-content-secondary truncate max-w-[120px]">
                {selectedColumn?.title ?? (lang === 'ru' ? 'Колонка' : 'Column')}
              </span>
              <ChevronDown size={12} className="text-content-tertiary" />
            </button>

            {showColumnPicker && (
              <div className="absolute bottom-full left-0 mb-1 w-48 bg-surface-elevated border border-border rounded-lg shadow-xl py-1 z-10">
                {boardColumns.map((col) => (
                  <button
                    key={col.id}
                    onClick={() => { setSelectedColumnId(col.id); setShowColumnPicker(false) }}
                    className={cn(
                      'w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left transition-colors',
                      col.id === selectedColumnId
                        ? 'bg-accent/10 text-accent'
                        : 'text-content-secondary hover:bg-surface-tertiary'
                    )}
                  >
                    {col.color && <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: col.color }} />}
                    <span className="truncate">{col.title}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <span className="text-[10px] text-content-tertiary">
            Tab {lang === 'ru' ? '— сменить колонку' : '— switch column'}
          </span>

          <div className="flex-1" />

          <button
            onClick={handleSubmit}
            disabled={!title.trim() || !selectedColumnId}
            className={cn(
              'px-3 py-1 rounded-lg text-xs font-medium transition-colors',
              title.trim() && selectedColumnId
                ? 'bg-accent text-white hover:bg-accent/90'
                : 'bg-surface-tertiary text-content-tertiary cursor-not-allowed'
            )}
          >
            {lang === 'ru' ? 'Создать' : 'Create'}
            <span className="ml-1.5 opacity-60">↵</span>
          </button>
        </div>
      </div>
    </div>
  )
}
