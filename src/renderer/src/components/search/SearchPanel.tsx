import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import {
  Search, X, LayoutDashboard, Plus, Settings, Archive, Moon, Sun, Monitor,
  List, CreditCard, CheckCircle2, Paperclip, Clock, ListTodo, Tag, Zap
} from 'lucide-react'
import { useAppStore, useBoardStore } from '@/store'
import { useTranslation } from '@/hooks/use-translation'
import { PRIORITY_CONFIG } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { Card, Priority } from '@/types'

/* ── Types ─────────────────────────────────────── */

interface SearchTag {
  type: 'label' | 'priority' | 'board' | 'has' | 'is'
  value: string
  display: string
}

interface ResultItem {
  id: string
  label: string
  description?: string
  icon: React.ReactNode
  section: string
  action: () => void
  keywords?: string[]
  card?: Card
}

/* ── Helpers ───────────────────────────────────── */

function parseSearchInput(raw: string): { tags: SearchTag[]; freeText: string } {
  const tags: SearchTag[] = []
  const parts: string[] = []
  const tagRegex = /(label|priority|board|has|is):(?:"([^"]+)"|(\S+))/gi
  let lastIndex = 0
  let match: RegExpExecArray | null
  while ((match = tagRegex.exec(raw)) !== null) {
    if (match.index > lastIndex) parts.push(raw.slice(lastIndex, match.index))
    lastIndex = match.index + match[0].length
    const type = match[1].toLowerCase() as SearchTag['type']
    const value = match[2] ?? match[3]
    tags.push({ type, value, display: `${type}:${value}` })
  }
  if (lastIndex < raw.length) parts.push(raw.slice(lastIndex))
  return { tags, freeText: parts.join(' ').trim() }
}

function getDueDateStatus(dueDate: string | null): 'overdue' | 'today' | 'upcoming' | null {
  if (!dueDate) return null
  const now = new Date()
  const due = new Date(dueDate)
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate())
  if (dueDay < today) return 'overdue'
  if (dueDay.getTime() === today.getTime()) return 'today'
  return 'upcoming'
}

function highlightText(text: string, q: string, maxLen: number) {
  const truncated = text.length > maxLen ? text.slice(0, maxLen) + '...' : text
  if (!q) return <>{truncated}</>
  const idx = truncated.toLowerCase().indexOf(q.toLowerCase())
  if (idx === -1) return <>{truncated}</>
  return (
    <>
      {truncated.slice(0, idx)}
      <mark className="bg-accent/20 text-accent rounded-sm px-0.5">{truncated.slice(idx, idx + q.length)}</mark>
      {truncated.slice(idx + q.length)}
    </>
  )
}

/* ── Component ─────────────────────────────────── */

export function SearchPanel() {
  const { t } = useTranslation()
  const lang = t('sidebar.boards') === 'Доски' ? 'ru' : 'en'

  const searchPanelOpen = useAppStore((s) => s.searchPanelOpen)
  const setSearchPanelOpen = useAppStore((s) => s.setSearchPanelOpen)
  const setActiveBoardId = useAppStore((s) => s.setActiveBoardId)
  const setActiveCardId = useAppStore((s) => s.setActiveCardId)
  const setViewMode = useAppStore((s) => s.setViewMode)
  const setSettingsOpen = useAppStore((s) => s.setSettingsOpen)
  const setArchivePanelOpen = useAppStore((s) => s.setArchivePanelOpen)
  const setTheme = useAppStore((s) => s.setTheme)
  const setShowDashboard = useAppStore((s) => s.setShowDashboard)
  const toggleSidebar = useAppStore((s) => s.toggleSidebar)
  const setNotesOpen = useAppStore((s) => s.setNotesOpen)
  const activeBoardId = useAppStore((s) => s.activeBoardId)

  const boards = useBoardStore((s) => s.boards)
  const boardOrder = useBoardStore((s) => s.boardOrder)
  const columns = useBoardStore((s) => s.columns)
  const cards = useBoardStore((s) => s.cards)
  const createBoard = useBoardStore((s) => s.createBoard)

  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const close = useCallback(() => {
    // Don't close during tutorial
    if (useAppStore.getState().showOnboarding) return
    setSearchPanelOpen(false)
  }, [setSearchPanelOpen])

  useEffect(() => {
    if (searchPanelOpen) {
      setQuery('')
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [searchPanelOpen])

  useEffect(() => { setSelectedIndex(0) }, [query])

  const { tags, freeText } = useMemo(() => parseSearchInput(query), [query])
  const q = freeText.toLowerCase()

  /* ── Build unified result list ────────────────── */
  const allResults = useMemo((): ResultItem[] => {
    const items: ResultItem[] = []
    const hasTags = tags.length > 0
    const sBoards = lang === 'ru' ? 'Доски' : 'Boards'
    const sCards = lang === 'ru' ? 'Карточки' : 'Cards'
    const sActions = lang === 'ru' ? 'Действия' : 'Actions'

    /* ── BOARDS ─── */
    if (!hasTags) {
      for (const bid of boardOrder) {
        const board = boards[bid]
        if (!board) continue
        if (q && !board.title.toLowerCase().includes(q)) continue
        items.push({
          id: `board-${bid}`,
          label: board.title,
          description: `${board.columnOrder.length} ${lang === 'ru' ? 'кол.' : 'col.'}`,
          icon: <LayoutDashboard size={16} />,
          section: sBoards,
          action: () => { setActiveBoardId(bid); setShowDashboard(false); close() }
        })
      }
    }

    /* ── CARDS ─── */
    const allCards = Object.values(cards)
    for (const card of allCards) {
      // Free text match: title, description, subtasks, comments, checklists
      let matches = false
      if (!q && !hasTags) continue // Don't list all cards when no query

      if (q) {
        const titleMatch = (card.title ?? '').toLowerCase().includes(q)
        const descMatch = (card.description ?? '').toLowerCase().includes(q)
        const subtaskMatch = (card.subtasks ?? []).some((s) => (s.title ?? '').toLowerCase().includes(q))
        const commentMatch = (card.comments ?? []).some((c) => (c.text ?? '').toLowerCase().includes(q))
        const checklistMatch = (card.checklists ?? []).some((cl) =>
          (cl.title ?? '').toLowerCase().includes(q) ||
          (cl.items ?? []).some((it) => (it.title ?? '').toLowerCase().includes(q))
        )
        const labelMatch = (card.labels ?? []).some((l) => (l.name ?? '').toLowerCase().includes(q))
        matches = titleMatch || descMatch || subtaskMatch || commentMatch || checklistMatch || labelMatch
      } else if (hasTags) {
        matches = true // tags only, will be filtered below
      }

      if (!matches) continue

      // Apply tag filters
      let passesFilters = true
      for (const tag of tags) {
        switch (tag.type) {
          case 'label': {
            const v = tag.value.toLowerCase()
            if (!(card.labels ?? []).some((l) => (l.name ?? '').toLowerCase().includes(v))) passesFilters = false
            break
          }
          case 'priority': {
            if (card.priority !== tag.value.toLowerCase()) passesFilters = false
            break
          }
          case 'board': {
            const b = boards[card.boardId]
            if (!b || !b.title.toLowerCase().includes(tag.value.toLowerCase())) passesFilters = false
            break
          }
          case 'has': {
            const v = tag.value.toLowerCase()
            if (v === 'attachment' && (!card.attachments || card.attachments.length === 0)) passesFilters = false
            if (v === 'subtask' && (card.subtasks ?? []).length === 0) passesFilters = false
            if (v === 'description' && !(card.description ?? '').trim()) passesFilters = false
            break
          }
          case 'is': {
            const v = tag.value.toLowerCase()
            if (v === 'completed' && !card.completed) passesFilters = false
            if (v === 'overdue' && getDueDateStatus(card.dueDate) !== 'overdue') passesFilters = false
            break
          }
        }
        if (!passesFilters) break
      }
      if (!passesFilters) continue

      // Build description with match context
      const boardName = boards[card.boardId]?.title ?? ''
      const colName = columns[card.columnId]?.title ?? ''
      let desc = `${boardName} › ${colName}`

      // Show where the match was found if not in title
      if (q && !(card.title ?? '').toLowerCase().includes(q)) {
        if ((card.labels ?? []).some((l) => (l.name ?? '').toLowerCase().includes(q))) {
          desc += ` · ${lang === 'ru' ? 'метка' : 'label'}`
        } else if ((card.description ?? '').toLowerCase().includes(q)) {
          desc += ` · ${lang === 'ru' ? 'описание' : 'description'}`
        } else if ((card.subtasks ?? []).some((s) => (s.title ?? '').toLowerCase().includes(q))) {
          desc += ` · ${lang === 'ru' ? 'подзадача' : 'subtask'}`
        } else if ((card.comments ?? []).some((c) => (c.text ?? '').toLowerCase().includes(q))) {
          desc += ` · ${lang === 'ru' ? 'комментарий' : 'comment'}`
        } else {
          desc += ` · ${lang === 'ru' ? 'чек-лист' : 'checklist'}`
        }
      }

      items.push({
        id: `card-${card.id}`,
        label: card.title,
        description: desc,
        icon: card.completed
          ? <CheckCircle2 size={16} className="text-green-500" />
          : <CreditCard size={16} />,
        section: sCards,
        card,
        action: () => { setActiveBoardId(card.boardId); setActiveCardId(card.id); close() }
      })

      if (items.filter((i) => i.section === sCards).length >= 30) break
    }

    /* ── ACTIONS (always available, regardless of tags) ─── */
    const actions: Omit<ResultItem, 'section'>[] = [
      {
        id: 'act-new-board',
        label: lang === 'ru' ? 'Создать доску' : 'Create board',
        icon: <Plus size={16} />,
        action: () => { const id = createBoard(lang === 'ru' ? 'Новая доска' : 'New Board'); setActiveBoardId(id); setShowDashboard(false); close() },
        keywords: ['new', 'create', 'board', 'создать', 'новая', 'доска']
      },
      {
        id: 'act-dashboard',
        label: lang === 'ru' ? 'Открыть обзор' : 'Open dashboard',
        icon: <LayoutDashboard size={16} />,
        action: () => { setShowDashboard(true); close() },
        keywords: ['dashboard', 'обзор', 'home']
      },
      {
        id: 'act-kanban',
        label: lang === 'ru' ? 'Режим: Канбан' : 'View: Kanban',
        icon: <LayoutDashboard size={16} />,
        action: () => { setViewMode('kanban'); close() },
        keywords: ['kanban', 'board', 'view', 'вид', 'канбан']
      },
      {
        id: 'act-table',
        label: lang === 'ru' ? 'Режим: Таблица' : 'View: Table',
        icon: <List size={16} />,
        action: () => { setViewMode('table'); close() },
        keywords: ['table', 'list', 'таблица']
      },
      {
        id: 'act-settings',
        label: lang === 'ru' ? 'Настройки' : 'Settings',
        icon: <Settings size={16} />,
        action: () => { setSettingsOpen(true); close() },
        keywords: ['settings', 'настройки', 'preferences']
      },
      {
        id: 'act-archive',
        label: lang === 'ru' ? 'Архив' : 'Archive',
        icon: <Archive size={16} />,
        action: () => { setArchivePanelOpen(true); close() },
        keywords: ['archive', 'архив']
      },
      {
        id: 'act-notes',
        label: lang === 'ru' ? 'Заметки' : 'Notes',
        icon: <Zap size={16} />,
        action: () => { setNotesOpen(true); close() },
        keywords: ['notes', 'заметки', 'quick']
      },
      {
        id: 'act-theme-light',
        label: lang === 'ru' ? 'Тема: Светлая' : 'Theme: Light',
        icon: <Sun size={16} />,
        action: () => { setTheme('light'); close() },
        keywords: ['theme', 'light', 'тема', 'светлая']
      },
      {
        id: 'act-theme-dark',
        label: lang === 'ru' ? 'Тема: Тёмная' : 'Theme: Dark',
        icon: <Moon size={16} />,
        action: () => { setTheme('dark'); close() },
        keywords: ['theme', 'dark', 'тема', 'тёмная']
      },
      {
        id: 'act-theme-system',
        label: lang === 'ru' ? 'Тема: Системная' : 'Theme: System',
        icon: <Monitor size={16} />,
        action: () => { setTheme('system'); close() },
        keywords: ['theme', 'system', 'тема', 'системная']
      },
      {
        id: 'act-toggle-sidebar',
        label: lang === 'ru' ? 'Переключить боковую панель' : 'Toggle sidebar',
        icon: <List size={16} />,
        action: () => { toggleSidebar(); close() },
        keywords: ['sidebar', 'toggle', 'панель', 'боковая', 'скрыть', 'показать']
      }
    ]

    for (const act of actions) {
      if (q) {
        const match = act.label.toLowerCase().includes(q) ||
          act.keywords?.some((kw) => kw.includes(q))
        if (!match) continue
      }
      items.push({ ...act, section: sActions })
    }

    return items
  }, [query, q, tags, freeText, boards, boardOrder, cards, columns, lang, activeBoardId,
    setActiveBoardId, setActiveCardId, setShowDashboard, setViewMode, setSettingsOpen,
    setArchivePanelOpen, setTheme, createBoard, close, toggleSidebar, setNotesOpen])

  /* ── Group results by section ────────────────── */
  const grouped = useMemo(() => {
    const map = new Map<string, ResultItem[]>()
    for (const item of allResults) {
      if (!map.has(item.section)) map.set(item.section, [])
      map.get(item.section)!.push(item)
    }
    return Array.from(map.entries()).map(([section, items]) => ({ section, items }))
  }, [allResults])

  /* ── Keyboard navigation ─────────────────────── */
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((i) => Math.min(i + 1, allResults.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      allResults[selectedIndex]?.action()
    } else if (e.key === 'Escape') {
      if (query) setQuery('')
      else close()
    }
  }, [allResults, selectedIndex, query, close])

  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${selectedIndex}"]`)
    el?.scrollIntoView({ block: 'nearest' })
  }, [selectedIndex])

  if (!searchPanelOpen) return null

  let itemIdx = 0

  return (
    <div data-tutorial="search-panel" className="fixed inset-0 z-[100] flex items-start justify-center pt-[12vh] px-4" onMouseDown={close}>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-xl bg-surface-elevated border border-border rounded-xl shadow-2xl overflow-hidden animate-scale-in"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Input */}
        <div className="flex items-center gap-2 px-4 border-b border-border">
          <Search size={16} className="text-content-tertiary shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('search.searchEverywhere' as any)}
            className="flex-1 h-12 bg-transparent text-sm text-content-primary placeholder:text-content-tertiary outline-none"
          />
          {query && (
            <button onClick={() => { setQuery(''); inputRef.current?.focus() }} className="text-content-tertiary hover:text-content-primary">
              <X size={14} />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] text-content-tertiary bg-surface-tertiary rounded border border-border">
            Ctrl+Space
          </kbd>
        </div>

        {/* Tag pills */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 px-4 pt-2">
            {tags.map((tag, i) => (
              <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent/10 text-accent text-xs font-medium">
                <Tag size={10} /> {tag.display}
              </span>
            ))}
          </div>
        )}

        {/* Results */}
        <div ref={listRef} className="max-h-[50vh] overflow-y-auto py-1">
          {query && allResults.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <Search size={28} className="mx-auto mb-2 text-content-tertiary opacity-40" />
              <p className="text-sm text-content-tertiary">{t('search.noResults' as any)}</p>
            </div>
          ) : !query ? (
            /* Empty state — quick filters + commands */
            <>
              <div className="px-4 py-3 space-y-1.5">
                <p className="text-[10px] uppercase text-content-tertiary font-semibold tracking-wider">
                  {lang === 'ru' ? 'Быстрые фильтры' : 'Quick filters'}
                </p>
                {[
                  { prefix: 'label:', desc: lang === 'ru' ? 'Фильтр по метке' : 'Filter by label' },
                  { prefix: 'priority:', desc: lang === 'ru' ? 'Фильтр по приоритету' : 'Filter by priority' },
                  { prefix: 'has:', desc: lang === 'ru' ? 'вложение, подзадача, описание' : 'attachment, subtask, description' },
                  { prefix: 'is:', desc: lang === 'ru' ? 'завершено, просрочено' : 'completed, overdue' }
                ].map((s) => (
                  <button
                    key={s.prefix}
                    onClick={() => { setQuery(s.prefix); inputRef.current?.focus() }}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left text-xs hover:bg-surface-tertiary transition-colors"
                  >
                    <code className="px-1.5 py-0.5 bg-surface-secondary border border-border rounded text-accent font-mono">{s.prefix}</code>
                    <span className="text-content-tertiary">{s.desc}</span>
                  </button>
                ))}
              </div>
              {/* Commands section */}
              <div className="border-t border-border">
                <div className="px-4 pt-2 pb-1 text-[10px] font-semibold text-content-tertiary uppercase tracking-wider">
                  {lang === 'ru' ? 'Команды' : 'Commands'}
                </div>
                {allResults.map((item) => {
                  const idx = itemIdx++
                  return (
                    <button
                      key={item.id}
                      data-idx={idx}
                      className={cn(
                        'w-full flex items-center gap-3 px-4 py-2 text-left transition-colors',
                        idx === selectedIndex ? 'bg-accent/10 text-accent' : 'text-content-primary hover:bg-surface-tertiary'
                      )}
                      onClick={item.action}
                      onMouseEnter={() => setSelectedIndex(idx)}
                    >
                      <span className="shrink-0 text-content-tertiary">{item.icon}</span>
                      <span className="text-sm truncate">{item.label}</span>
                    </button>
                  )
                })}
              </div>
            </>
          ) : (
            grouped.map((group) => (
              <div key={group.section}>
                <div className="px-4 pt-2 pb-1 text-[10px] font-semibold text-content-tertiary uppercase tracking-wider">
                  {group.section}
                </div>
                {group.items.map((item) => {
                  const idx = itemIdx++
                  const isCard = !!item.card
                  return (
                    <button
                      key={item.id}
                      data-idx={idx}
                      className={cn(
                        'w-full flex items-center gap-3 px-4 py-2 text-left transition-colors',
                        idx === selectedIndex ? 'bg-accent/10 text-accent' : 'text-content-primary hover:bg-surface-tertiary'
                      )}
                      onClick={item.action}
                      onMouseEnter={() => setSelectedIndex(idx)}
                    >
                      <span className="shrink-0 text-content-tertiary">{item.icon}</span>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm truncate block">
                          {isCard ? highlightText(item.label, freeText, 80) : item.label}
                        </span>
                        {item.description && (
                          <span className="text-xs text-content-tertiary truncate block">{item.description}</span>
                        )}
                      </div>
                      {isCard && item.card && (
                        <div className="flex items-center gap-1.5 shrink-0">
                          {item.card.priority !== 'none' && (
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: PRIORITY_CONFIG[item.card.priority].borderColor }}
                            />
                          )}
                          {item.card.subtasks.length > 0 && (
                            <span className="text-[10px] text-content-tertiary">
                              <ListTodo size={10} className="inline" /> {item.card.subtasks.filter((s) => s.completed).length}/{item.card.subtasks.length}
                            </span>
                          )}
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-border flex items-center gap-4 text-[10px] text-content-tertiary">
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 bg-surface-tertiary rounded border border-border">↑↓</kbd>
            {lang === 'ru' ? 'навигация' : 'navigate'}
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 bg-surface-tertiary rounded border border-border">↵</kbd>
            {lang === 'ru' ? 'выбрать' : 'select'}
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 bg-surface-tertiary rounded border border-border">esc</kbd>
            {lang === 'ru' ? 'закрыть' : 'close'}
          </span>
        </div>
      </div>
    </div>
  )
}
