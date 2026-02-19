import { useState, useRef, useEffect } from 'react'
import { Search, Filter, Download, Upload, X, LayoutDashboard, List, BarChart3, Flame, GanttChart, Zap, ChevronDown, Clock, FileText, Image } from 'lucide-react'
import { useBoardStore, useAppStore, useFilterStore } from '@/store'
import { useToastStore } from '@/store/toast-store'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Dropdown, DropdownItem, DropdownSeparator } from '@/components/ui/Dropdown'
import { PRIORITY_CONFIG, LABEL_COLORS } from '@/lib/constants'
import { exportToJSON, exportBoardToJSON, exportBoardToCSV, exportBoardToPdfHtml, importFromJSON } from '@/lib/export'
import { BoardStats } from './BoardStats'
import { AutomationsModal } from './AutomationsModal'
import { registerAutomationsOpener } from '@/components/onboarding/OnboardingTutorial'
import { useDebounce } from '@/hooks/use-debounce'
import { useTranslation } from '@/hooks/use-translation'
import { cn } from '@/lib/utils'
import type { Priority } from '@/types'

export function BoardHeader() {
  const { t } = useTranslation()
  const sidebarOpen = useAppStore((s) => s.sidebarOpen)
  const activeBoardId = useAppStore((s) => s.activeBoardId)
  const viewMode = useAppStore((s) => s.viewMode)
  const setViewMode = useAppStore((s) => s.setViewMode)
  const boards = useBoardStore((s) => s.boards)
  const updateBoard = useBoardStore((s) => s.updateBoard)
  const globalLabels = useBoardStore((s) => s.globalLabels)
  const board = activeBoardId ? boards[activeBoardId] : null

  const searchQuery = useFilterStore((s) => s.searchQuery)
  const setSearchQuery = useFilterStore((s) => s.setSearchQuery)
  const labelIds = useFilterStore((s) => s.labelIds)
  const toggleLabelFilter = useFilterStore((s) => s.toggleLabelFilter)
  const priorities = useFilterStore((s) => s.priorities)
  const togglePriorityFilter = useFilterStore((s) => s.togglePriorityFilter)
  const showOverdueOnly = useFilterStore((s) => s.showOverdueOnly)
  const toggleOverdueOnly = useFilterStore((s) => s.toggleOverdueOnly)
  const clearAllFilters = useFilterStore((s) => s.clearAllFilters)
  const hasActiveFilters = useFilterStore((s) => s.hasActiveFilters)

  const setSearchPanelOpen = useAppStore((s) => s.setSearchPanelOpen)

  const lang = t('sidebar.boards') === 'Доски' ? 'ru' : 'en'
  const [editingTitle, setEditingTitle] = useState(false)
  const [title, setTitle] = useState('')
  const [filtersExpanded, setFiltersExpanded] = useState(false)
  const [statsOpen, setStatsOpen] = useState(false)
  const [automationsOpen, setAutomationsOpen] = useState(false)

  // Register automations opener for tutorial
  useEffect(() => {
    registerAutomationsOpener(setAutomationsOpen)
    return () => registerAutomationsOpener(() => {})
  }, [])

  const filterBarRef = useRef<HTMLDivElement>(null)
  const filterBtnRef = useRef<HTMLButtonElement>(null)

  // Click-outside to close filter bar
  useEffect(() => {
    if (!filtersExpanded) return
    const handler = (e: MouseEvent) => {
      const target = e.target as Node
      if (filterBarRef.current?.contains(target)) return
      if (filterBtnRef.current?.contains(target)) return
      setFiltersExpanded(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [filtersExpanded])

  if (!board || !activeBoardId) return null

  const handleTitleSave = () => {
    if (title.trim() && title.trim() !== board.title) {
      updateBoard(activeBoardId, { title: title.trim() })
    }
    setEditingTitle(false)
  }

  const handleExportAllJSON = async () => {
    try {
      const path = await window.electronAPI.saveFileDialog('flowzik-all-boards.json')
      if (path) {
        await window.electronAPI.writeFile(path, exportToJSON())
        addToast(lang === 'ru' ? 'Экспорт завершён' : 'Export complete', 'success')
      }
    } catch {
      addToast(lang === 'ru' ? 'Ошибка экспорта' : 'Export failed', 'error')
    }
  }

  const handleExportBoardJSON = async () => {
    try {
      const path = await window.electronAPI.saveFileDialog(`${board.title}.json`)
      if (path) {
        await window.electronAPI.writeFile(path, exportBoardToJSON(activeBoardId))
        addToast(lang === 'ru' ? 'Экспорт завершён' : 'Export complete', 'success')
      }
    } catch {
      addToast(lang === 'ru' ? 'Ошибка экспорта' : 'Export failed', 'error')
    }
  }

  const handleExportCSV = async () => {
    try {
      const path = await window.electronAPI.saveFileDialog(`${board.title}.csv`)
      if (path) {
        await window.electronAPI.writeFile(path, exportBoardToCSV(activeBoardId))
        addToast(lang === 'ru' ? 'Экспорт завершён' : 'Export complete', 'success')
      }
    } catch {
      addToast(lang === 'ru' ? 'Ошибка экспорта' : 'Export failed', 'error')
    }
  }

  const addToast = useToastStore((s) => s.addToast)

  const handleExportPDF = async () => {
    try {
      const html = exportBoardToPdfHtml(activeBoardId)
      if (html) {
        await window.electronAPI.exportPdf(html)
      }
    } catch {
      addToast(lang === 'ru' ? 'Ошибка экспорта PDF' : 'PDF export failed', 'error')
    }
  }

  const handleExportImage = async () => {
    try {
      const html = exportBoardToPdfHtml(activeBoardId)
      if (!html) return
      const filePath = await window.electronAPI.exportImage(html)
      if (filePath) {
        addToast(
          lang === 'ru' ? 'Изображение сохранено' : 'Image saved',
          'success',
          6000,
          {
            actionLabel: lang === 'ru' ? 'Открыть папку' : 'Show in folder',
            onAction: () => window.electronAPI.showItemInFolder(filePath)
          }
        )
      }
    } catch {
      addToast(lang === 'ru' ? 'Ошибка экспорта изображения' : 'Image export failed', 'error')
    }
  }

  const handleImport = async () => {
    try {
      const path = await window.electronAPI.openFileDialog()
      if (path) {
        const content = await window.electronAPI.readFile(path)
        importFromJSON(content)
        addToast(lang === 'ru' ? 'Данные импортированы' : 'Data imported', 'success')
      }
    } catch (err) {
      addToast(lang === 'ru' ? 'Ошибка импорта: неверный формат файла' : 'Import error: invalid file format', 'error')
    }
  }

  return (
    <div data-tutorial="board-header" className={cn('relative flex items-center flex-wrap gap-3 py-3 border-b border-border shrink-0', sidebarOpen ? 'px-6' : 'pl-14 pr-6')}>
      {/* Board title */}
      {editingTitle ? (
        <input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={handleTitleSave}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleTitleSave()
            if (e.key === 'Escape') setEditingTitle(false)
          }}
          className="text-lg font-bold bg-transparent text-content-primary outline-none border-b-2 border-accent px-1"
        />
      ) : (
        <h1
          className="text-lg font-bold text-content-primary cursor-pointer hover:text-accent transition-colors"
          onDoubleClick={() => { setEditingTitle(true); setTitle(board.title) }}
        >
          {board.title}
        </h1>
      )}

      <div className="flex-1" />

      {/* View mode toggle */}
      <div className="flex items-center bg-surface-tertiary rounded-lg p-0.5">
        <button
          onClick={() => setViewMode('kanban')}
          className={cn(
            'flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors',
            viewMode === 'kanban' ? 'bg-surface-elevated text-content-primary shadow-sm' : 'text-content-tertiary hover:text-content-secondary'
          )}
          title={t('boardHeader.kanbanView' as any)}
        >
          <LayoutDashboard size={12} />
          {t('boardHeader.kanbanView' as any)}
        </button>
        <button
          onClick={() => setViewMode('table')}
          className={cn(
            'flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors',
            viewMode === 'table' ? 'bg-surface-elevated text-content-primary shadow-sm' : 'text-content-tertiary hover:text-content-secondary'
          )}
          title={t('boardHeader.tableView' as any)}
        >
          <List size={12} />
          {t('boardHeader.tableView' as any)}
        </button>
        <button
          onClick={() => setViewMode('heatmap')}
          className={cn(
            'flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors',
            viewMode === 'heatmap' ? 'bg-surface-elevated text-content-primary shadow-sm' : 'text-content-tertiary hover:text-content-secondary'
          )}
          title={lang === 'ru' ? 'Тепловая карта' : 'Heatmap'}
        >
          <Flame size={12} />
        </button>
        <button
          onClick={() => setViewMode('timeline')}
          className={cn(
            'flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors',
            viewMode === 'timeline' ? 'bg-surface-elevated text-content-primary shadow-sm' : 'text-content-tertiary hover:text-content-secondary'
          )}
          title={lang === 'ru' ? 'Таймлайн' : 'Timeline'}
        >
          <GanttChart size={12} />
        </button>
      </div>

      {/* Automations */}
      <Button variant="ghost" size="icon" onClick={() => setAutomationsOpen(true)} title={lang === 'ru' ? 'Автоматизации' : 'Automations'}>
        <Zap size={16} />
      </Button>

      {/* Stats */}
      <Button variant="ghost" size="icon" onClick={() => setStatsOpen(!statsOpen)} title={t('boardHeader.stats' as any)}>
        <BarChart3 size={16} />
      </Button>

      {/* Filters toggle */}
      <Button
        ref={filterBtnRef}
        variant="ghost"
        size="sm"
        onClick={() => setFiltersExpanded(!filtersExpanded)}
        className={cn(hasActiveFilters() && 'text-accent')}
      >
        <Filter size={14} />
        {t('boardHeader.filter')}
        {hasActiveFilters() && (
          <span className="w-1.5 h-1.5 rounded-full bg-accent" />
        )}
        <ChevronDown size={12} className={cn('transition-transform', filtersExpanded && 'rotate-180')} />
      </Button>

      {/* Export/Import */}
      <Dropdown
        trigger={
          <Button variant="ghost" size="icon" title={t('boardHeader.export')}>
            <Download size={16} />
          </Button>
        }
        align="right"
      >
        <div className="px-3 py-1.5 text-[10px] font-medium text-content-tertiary uppercase tracking-wider">
          {lang === 'ru' ? 'Текущая доска' : 'Current board'}
        </div>
        <DropdownItem onClick={handleExportBoardJSON}>
          <Download size={14} /> {lang === 'ru' ? 'Экспорт JSON (доска)' : 'Export JSON (board)'}
        </DropdownItem>
        <DropdownItem onClick={handleExportCSV}>
          <Download size={14} /> {lang === 'ru' ? 'Экспорт CSV (доска)' : 'Export CSV (board)'}
        </DropdownItem>
        <DropdownItem onClick={handleExportPDF}>
          <FileText size={14} /> {lang === 'ru' ? 'Экспорт PDF (доска)' : 'Export PDF (board)'}
        </DropdownItem>
        <DropdownItem onClick={handleExportImage}>
          <Image size={14} /> {lang === 'ru' ? 'Экспорт PNG (доска)' : 'Export PNG (board)'}
        </DropdownItem>
        <DropdownSeparator />
        <div className="px-3 py-1.5 text-[10px] font-medium text-content-tertiary uppercase tracking-wider">
          {lang === 'ru' ? 'Все данные' : 'All data'}
        </div>
        <DropdownItem onClick={handleExportAllJSON}>
          <Download size={14} /> {lang === 'ru' ? 'Экспорт всего (JSON)' : 'Export all (JSON)'}
        </DropdownItem>
        <DropdownSeparator />
        <DropdownItem onClick={handleImport}>
          <Upload size={14} /> {t('boardHeader.importJson')}
        </DropdownItem>
      </Dropdown>

      <BoardStats boardId={activeBoardId} open={statsOpen} onClose={() => setStatsOpen(false)} />
      <AutomationsModal open={automationsOpen} onClose={() => setAutomationsOpen(false)} />

      {/* Filter dropdown panel */}
      {filtersExpanded && (
        <div ref={filterBarRef} className="absolute right-6 top-full mt-1 z-20 w-80 bg-surface-elevated border border-border rounded-xl shadow-2xl overflow-hidden">
          {/* Quick filter input */}
          <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border">
            <Search size={13} className="text-content-tertiary shrink-0" />
            <input
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={lang === 'ru' ? 'Быстрый фильтр...' : 'Quick filter...'}
              className="flex-1 bg-transparent text-sm text-content-primary placeholder:text-content-tertiary outline-none"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-content-tertiary hover:text-content-primary">
                <X size={12} />
              </button>
            )}
          </div>

          <div className="p-3 space-y-3 max-h-[60vh] overflow-y-auto">
            {/* Priority */}
            <div>
              <div className="text-[10px] font-semibold text-content-tertiary uppercase tracking-wider mb-1.5">
                {lang === 'ru' ? 'Приоритет' : 'Priority'}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(['low', 'medium', 'high', 'urgent'] as Priority[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => togglePriorityFilter(p)}
                    className={cn(
                      'px-2.5 py-1 rounded-lg text-xs font-medium transition-all border',
                      priorities.includes(p)
                        ? 'border-current shadow-sm'
                        : 'border-border text-content-secondary hover:border-border-hover'
                    )}
                    style={priorities.includes(p) ? {
                      color: PRIORITY_CONFIG[p].borderColor,
                      backgroundColor: `${PRIORITY_CONFIG[p].borderColor}15`,
                      borderColor: PRIORITY_CONFIG[p].borderColor
                    } : undefined}
                  >
                    {t(`priority.${p}`)}
                  </button>
                ))}
              </div>
            </div>

            {/* Labels */}
            {globalLabels.length > 0 && (
              <div>
                <div className="text-[10px] font-semibold text-content-tertiary uppercase tracking-wider mb-1.5">
                  {lang === 'ru' ? 'Метки' : 'Labels'}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {globalLabels.map((label) => (
                    <button
                      key={label.id}
                      onClick={() => toggleLabelFilter(label.id)}
                      className={cn(
                        'flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all border',
                        labelIds.includes(label.id)
                          ? 'shadow-sm'
                          : 'border-border text-content-secondary hover:border-border-hover'
                      )}
                      style={labelIds.includes(label.id) ? {
                        color: label.color,
                        backgroundColor: `${label.color}15`,
                        borderColor: label.color
                      } : undefined}
                    >
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: label.color }} />
                      {label.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Overdue */}
            <div>
              <button
                onClick={toggleOverdueOnly}
                className={cn(
                  'flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all border w-full text-left',
                  showOverdueOnly
                    ? 'border-red-500 text-red-500 bg-red-500/10'
                    : 'border-border text-content-secondary hover:border-border-hover'
                )}
              >
                <Clock size={12} />
                {t('boardHeader.overdueOnly')}
              </button>
            </div>
          </div>

          {/* Footer */}
          {hasActiveFilters() && (
            <div className="px-3 py-2 border-t border-border">
              <button
                onClick={clearAllFilters}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs text-accent hover:bg-accent/10 transition-colors w-full justify-center"
              >
                <X size={12} />
                {t('boardHeader.clearFilters')}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
