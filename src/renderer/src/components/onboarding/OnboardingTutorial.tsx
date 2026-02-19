import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Rocket, ArrowRight, ArrowLeft, X, Check,
  LayoutDashboard, Plus, MousePointerClick,
  StickyNote, Keyboard, Archive,
  GripVertical, Palette, Search,
  Settings, MousePointer2, Zap
} from 'lucide-react'
import { useAppStore, useBoardStore } from '@/store'
import { cn } from '@/lib/utils'
import { playClick, playSuccess } from '@/lib/sounds'

type StepAction =
  | 'create-demo'
  | 'open-card'
  | 'close-card'
  | 'open-notes'
  | 'close-notes'
  | 'open-search'
  | 'close-search'
  | 'open-archive'
  | 'close-archive'
  | 'open-settings'
  | 'close-settings'
  | 'open-automations'
  | 'close-automations'

interface TutorialStep {
  target?: string        // data-tutorial attribute value to highlight
  panelTarget?: string   // data-tutorial of panel to highlight (lowers overlay z-index)
  tooltipPosition?: 'bottom-left' | 'bottom-right' // override tooltip corner for panel steps
  titleEn: string
  titleRu: string
  descEn: string | React.ReactNode
  descRu: string | React.ReactNode
  icon: React.ReactNode
  action?: StepAction
  cleanup?: StepAction
}

/* ── Keyboard shortcuts visual block for step 11 ────── */
const SHORTCUTS = [
  { keys: 'Ctrl+F / Ctrl+K', en: 'Search', ru: 'Поиск' },
  { keys: 'Ctrl+Space', en: 'Command palette', ru: 'Палитра команд' },
  { keys: 'Ctrl+N', en: 'Notes', ru: 'Заметки' },
  { keys: 'Ctrl+Tab', en: 'Sidebar', ru: 'Боковая панель' },
  { keys: 'Ctrl+B', en: 'New board', ru: 'Новая доска' },
  { keys: 'Ctrl+Z / Y', en: 'Undo / Redo', ru: 'Отмена / Повтор' },
  { keys: 'Escape', en: 'Close', ru: 'Закрыть' },
  { keys: '↑↓←→', en: 'Navigate cards', ru: 'Навигация' },
  { keys: 'Enter', en: 'Open card', ru: 'Открыть карточку' },
  { keys: 'Shift+Click', en: 'Multi-select', ru: 'Мультивыбор' },
]

function ShortcutsGrid({ isRu }: { isRu: boolean }) {
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-1 mt-1">
      {SHORTCUTS.map((s) => (
        <div key={s.keys} className="flex items-center gap-1.5">
          <kbd className="shrink-0 px-1.5 py-0.5 bg-surface-tertiary border border-border rounded text-[10px] font-mono text-content-secondary">
            {s.keys}
          </kbd>
          <span className="text-[11px] text-content-tertiary truncate">{isRu ? s.ru : s.en}</span>
        </div>
      ))}
    </div>
  )
}

const STEPS: TutorialStep[] = [
  // 0 — Welcome
  {
    titleEn: 'Welcome to FlowZik!',
    titleRu: 'Добро пожаловать в FlowZik!',
    descEn: 'Let\'s take an interactive tour! We\'ll create a demo board, open panels, and walk through every feature — you\'ll see exactly how everything works.',
    descRu: 'Пройдём интерактивный тур! Создадим демо-доску, откроем все панели и покажем каждую функцию — вы увидите как всё работает.',
    icon: <Rocket size={28} />
  },
  // 1 — Create demo board + show sidebar
  {
    target: 'sidebar',
    titleEn: 'Sidebar — Your Boards',
    titleRu: 'Боковая панель — Ваши доски',
    descEn: 'All boards live here. We just created a rich demo board with cards, subtasks, labels, and due dates. Drag boards to reorder or into folders. Right-click for options. Toggle sidebar: Ctrl+Tab.',
    descRu: 'Здесь живут все доски. Мы создали демо-доску с карточками, подзадачами, метками и дедлайнами. Перетаскивайте для сортировки или в папки. ПКМ для опций. Ctrl+Tab — скрыть панель.',
    icon: <LayoutDashboard size={22} />,
    action: 'create-demo'
  },
  // 2 — New board button
  {
    target: 'new-board',
    titleEn: 'Create & Import Boards',
    titleRu: 'Создание и импорт',
    descEn: 'Click "+" to create a board or use templates for quick setup. You can also import boards from JSON files. Shortcut: Ctrl+B to create a new board.',
    descRu: 'Нажмите "+" для создания доски или используйте шаблоны. Импорт из JSON тоже поддерживается. Хоткей: Ctrl+B — создать доску.',
    icon: <Plus size={22} />
  },
  // 3 — Board header / toolbar
  {
    target: 'board-header',
    titleEn: 'Board Toolbar',
    titleRu: 'Панель инструментов',
    descEn: 'Double-click the title to rename. Filter by labels, priority, due dates. Switch views: Kanban, Table, Heatmap, Timeline. Export to JSON, CSV, PDF, or PNG image.',
    descRu: 'Двойной клик на заголовок — переименовать. Фильтры по меткам, приоритету, срокам. Виды: Канбан, Таблица, Тепловая карта, Таймлайн. Экспорт: JSON, CSV, PDF, PNG.',
    icon: <Palette size={22} />
  },
  // 4 — Board content, drag & drop
  {
    target: 'main-content',
    titleEn: 'Drag & Drop Everything',
    titleRu: 'Перетаскивайте всё',
    descEn: 'Drag cards between columns, drag columns to reorder. Shift+click to select multiple cards, then right-click for bulk actions (move, set priority, delete). Hover a card to see its preview.',
    descRu: 'Перетаскивайте карточки между колонками, колонки тоже. Shift+клик — выделение нескольких, затем ПКМ для массовых действий. Наведите на карточку — превью.',
    icon: <GripVertical size={22} />
  },
  // 5 — Auto-open card detail (panelMode)
  {
    panelTarget: 'card-detail',
    titleEn: 'Card Details',
    titleRu: 'Детали карточки',
    descEn: 'This is the card detail view! Set priority, labels, due dates, add subtasks, checklists, write descriptions in Markdown, leave comments, attach files (drag from Explorer!), and set cover images.',
    descRu: 'Это детальный вид карточки! Приоритет, метки, дедлайны, подзадачи, чеклисты, описание (Markdown), комментарии, вложения (перетащите файлы!), обложка.',
    icon: <MousePointerClick size={22} />,
    action: 'open-card',
    cleanup: 'close-card'
  },
  // 6 — Auto-open notes (panelMode)
  {
    panelTarget: 'quick-notes',
    titleEn: 'Quick Notes',
    titleRu: 'Быстрые заметки',
    descEn: 'A scratchpad for quick ideas and thoughts! Write in Markdown, select text and right-click to create a card from it. Notes persist across sessions. Shortcut: Ctrl+N.',
    descRu: 'Блокнот для быстрых идей! Пишите в Markdown, выделите текст → ПКМ → создать карточку. Заметки сохраняются. Хоткей: Ctrl+N.',
    icon: <StickyNote size={22} />,
    action: 'open-notes',
    cleanup: 'close-notes'
  },
  // 7 — Auto-open search/command palette (panelMode)
  {
    panelTarget: 'search-panel',
    titleEn: 'Search & Command Palette',
    titleRu: 'Поиск и команды',
    descEn: 'Search across all boards and cards instantly. Also works as a command palette — type to find actions like "New board", "Notes", "Settings". Shortcuts: Ctrl+F, Ctrl+K, or Ctrl+Space.',
    descRu: 'Поиск по всем доскам и карточкам. Также палитра команд — найдите действия: «Новая доска», «Заметки», «Настройки». Хоткеи: Ctrl+F, Ctrl+K или Ctrl+Space.',
    icon: <Search size={22} />,
    action: 'open-search',
    cleanup: 'close-search'
  },
  // 8 — Auto-open archive (panelMode) — tooltip on left since panel is on right
  {
    panelTarget: 'archive-panel',
    tooltipPosition: 'bottom-left',
    titleEn: 'Archive',
    titleRu: 'Архив',
    descEn: 'Archived cards and columns go here. You can restore them or permanently delete. Right-click a card → "Archive" to send it here.',
    descRu: 'Архивированные карточки и колонки попадают сюда. Можно восстановить или удалить навсегда. ПКМ на карточке → «Архивировать».',
    icon: <Archive size={22} />,
    action: 'open-archive',
    cleanup: 'close-archive'
  },
  // 9 — Auto-open settings (panelMode)
  {
    panelTarget: 'settings-modal',
    titleEn: 'Settings & Themes',
    titleRu: 'Настройки и темы',
    descEn: 'Customize everything! 30+ color themes, accent colors, board backgrounds (patterns, colors, images), UI scale, card appearance, sounds, notifications, and more.',
    descRu: 'Настройте всё! 30+ тем, акцентные цвета, фоны доски (паттерны, цвета, картинки), масштаб UI, вид карточек, звуки, уведомления и многое другое.',
    icon: <Settings size={22} />,
    action: 'open-settings',
    cleanup: 'close-settings'
  },
  // 10 — Auto-open automations (panelMode)
  {
    panelTarget: 'automations-modal',
    titleEn: 'Automations',
    titleRu: 'Автоматизации',
    descEn: 'Set up rules: when a card is created, moved, completed, or overdue — automatically set priority, add labels, move to column, set due dates, and more. Open via ⚡ in the board toolbar.',
    descRu: 'Настройте правила: когда карточка создана, перемещена, завершена или просрочена — автоматически: приоритет, метки, перемещение, дедлайны. Откройте через ⚡ в тулбаре.',
    icon: <Zap size={22} />,
    action: 'open-automations',
    cleanup: 'close-automations'
  },
  // 11 — Keyboard shortcuts (visual grid)
  {
    titleEn: 'Keyboard Shortcuts',
    titleRu: 'Горячие клавиши',
    descEn: '', // rendered as custom component
    descRu: '',
    icon: <Keyboard size={22} />
  },
  // 12 — All set
  {
    titleEn: 'You\'re All Set!',
    titleRu: 'Всё готово!',
    descEn: 'Your demo board is saved — feel free to explore, edit, and experiment with it! Right-click everywhere for context menus. Restart this tutorial anytime from Settings. Enjoy FlowZik!',
    descRu: 'Демо-доска сохранена — изучайте, редактируйте и экспериментируйте! ПКМ везде — для контекстного меню. Перезапуск туториала из Настроек. Приятной работы с FlowZik!',
    icon: <Check size={28} />
  }
]

// Keyboard shortcuts step index
const SHORTCUTS_STEP = 11

// Store ref for automations modal open state (managed by BoardHeader)
let automationsOpenSetter: ((v: boolean) => void) | null = null
export function registerAutomationsOpener(setter: (v: boolean) => void) {
  automationsOpenSetter = setter
}

export function OnboardingTutorial() {
  const onboardingComplete = useAppStore((s) => s.onboardingComplete)
  const showOnboarding = useAppStore((s) => s.showOnboarding)
  const setOnboardingComplete = useAppStore((s) => s.setOnboardingComplete)
  const setShowOnboarding = useAppStore((s) => s.setShowOnboarding)
  const language = useAppStore((s) => s.language)
  const sidebarOpen = useAppStore((s) => s.sidebarOpen)
  const setSidebarOpen = useAppStore((s) => s.setSidebarOpen)

  const [step, setStep] = useState(0)
  const [highlight, setHighlight] = useState<DOMRect | null>(null)
  const [animating, setAnimating] = useState(false)
  const [clickIndicator, setClickIndicator] = useState<{ x: number; y: number } | null>(null)
  const demoCreated = useRef(false)
  const demoBoardId = useRef<string | null>(null)
  const demoCardId = useRef<string | null>(null)
  const previousBoardId = useRef<string | null>(null)
  const stepRef = useRef(step)
  stepRef.current = step

  const isRu = language === 'ru'
  const currentStep = STEPS[step]
  const isFirst = step === 0
  const isLast = step === STEPS.length - 1
  const isPanelStep = !!currentStep.panelTarget

  // Auto-show on first launch — but only after stores finish hydrating from disk.
  // Without this gate the tutorial creates a demo board before hydration completes,
  // then hydration overwrites the store with empty data → blank screen.
  useEffect(() => {
    if (onboardingComplete || showOnboarding) return

    const tryShow = () => {
      if (useBoardStore.persist.hasHydrated() && useAppStore.persist.hasHydrated()) {
        if (useAppStore.getState().onboardingComplete) return true
        setTimeout(() => setShowOnboarding(true), 400)
        return true
      }
      return false
    }

    if (tryShow()) return

    const unsub1 = useBoardStore.persist.onFinishHydration(() => tryShow())
    const unsub2 = useAppStore.persist.onFinishHydration(() => tryShow())
    return () => { unsub1(); unsub2() }
  }, [onboardingComplete, showOnboarding, setShowOnboarding])

  // Ensure sidebar is open during tutorial
  useEffect(() => {
    if (showOnboarding && !sidebarOpen) {
      setSidebarOpen(true)
    }
  }, [showOnboarding, sidebarOpen, setSidebarOpen])

  // Execute step action
  const executeAction = useCallback((action: StepAction) => {
    const appStore = useAppStore.getState()
    switch (action) {
      case 'create-demo': {
        if (demoCreated.current) return
        demoCreated.current = true
        const store = useBoardStore.getState()

        // Save user's current board so we can restore later
        previousBoardId.current = appStore.activeBoardId

        // Always create a fresh TestBoard
        const boardId = store.createBoard('✨ Tutorial Board')
        demoBoardId.current = boardId

        const col1Id = store.createColumn(boardId, isRu ? 'К выполнению' : 'To Do')
        const col2Id = store.createColumn(boardId, isRu ? 'В работе' : 'In Progress')
        const col3Id = store.createColumn(boardId, isRu ? 'Готово' : 'Done')

        // Create labels
        const labelBugId = store.createLabel(isRu ? 'Баг' : 'Bug', '#ef4444', '🐛')
        const labelFeatureId = store.createLabel(isRu ? 'Фича' : 'Feature', '#3b82f6', '✨')
        const labelDesignId = store.createLabel(isRu ? 'Дизайн' : 'Design', '#a855f7', '🎨')
        const labelUrgentId = store.createLabel(isRu ? 'Срочно' : 'Urgent', '#f97316', '🔥')

        const labels = store.globalLabels

        // Card 1 — rich card
        const card1Id = store.createCard(col1Id, isRu ? 'Разработать главную страницу' : 'Build the landing page')
        store.updateCard(card1Id, {
          priority: 'high',
          description: isRu
            ? '## Задача\nСоздать адаптивную главную страницу:\n- Героический блок\n- Секция фич\n- Форма подписки\n\n> Дизайн в Figma'
            : '## Task\nCreate a responsive landing page:\n- Hero section\n- Feature highlights\n- Newsletter signup\n\n> Design files in Figma',
          dueDate: new Date(Date.now() + 3 * 86400000).toISOString()
        })
        store.addSubtask(card1Id, isRu ? 'Сверстать хедер' : 'Build the header')
        store.addSubtask(card1Id, isRu ? 'Героический блок' : 'Create hero section')
        store.addSubtask(card1Id, isRu ? 'Секция фич' : 'Add features section')
        store.addSubtask(card1Id, isRu ? 'Футер и навигация' : 'Footer and navigation')
        const featureLabel = labels.find(l => l.id === labelFeatureId)
        const designLabel = labels.find(l => l.id === labelDesignId)
        if (featureLabel) store.addLabelToCard(card1Id, featureLabel)
        if (designLabel) store.addLabelToCard(card1Id, designLabel)
        store.addComment(card1Id, isRu ? 'Не забыть мобильную версию!' : 'Don\'t forget mobile responsiveness!')
        demoCardId.current = card1Id

        // Card 2
        const card2Id = store.createCard(col1Id, isRu ? 'Настроить CI/CD' : 'Set up CI/CD pipeline')
        store.updateCard(card2Id, { priority: 'medium' })
        store.addSubtask(card2Id, isRu ? 'Выбрать платформу' : 'Choose CI platform')
        store.addSubtask(card2Id, isRu ? 'Написать конфиг' : 'Write config file')

        // Card 3 — urgent bug
        const card3Id = store.createCard(col1Id, isRu ? 'Исправить баг авторизации' : 'Fix auth login bug')
        store.updateCard(card3Id, {
          priority: 'urgent',
          dueDate: new Date(Date.now() + 86400000).toISOString()
        })
        const bugLabel = labels.find(l => l.id === labelBugId)
        const urgentLabel = labels.find(l => l.id === labelUrgentId)
        if (bugLabel) store.addLabelToCard(card3Id, bugLabel)
        if (urgentLabel) store.addLabelToCard(card3Id, urgentLabel)

        // Card 4 — in progress
        const card4Id = store.createCard(col2Id, isRu ? 'Написать API эндпоинты' : 'Write API endpoints')
        store.updateCard(card4Id, { priority: 'high' })
        store.addSubtask(card4Id, 'GET /users')
        store.addSubtask(card4Id, 'POST /auth/login')
        store.addSubtask(card4Id, 'PUT /users/:id')
        if (featureLabel) store.addLabelToCard(card4Id, featureLabel)

        store.createCard(col2Id, isRu ? 'Дизайн иконок' : 'Design icon set')

        // Done cards
        const card6Id = store.createCard(col3Id, isRu ? 'Настроить проект' : 'Set up project')
        store.updateCard(card6Id, { completed: true, priority: 'low' })
        const card7Id = store.createCard(col3Id, isRu ? 'Выбрать стек' : 'Choose tech stack')
        store.updateCard(card7Id, { completed: true })

        appStore.setActiveBoardId(boardId)
        appStore.setShowDashboard(false)
        break
      }
      case 'open-card': {
        if (demoCardId.current) {
          const expectedStep = stepRef.current
          showClickIndicatorAt('main-content')
          setTimeout(() => {
            if (stepRef.current !== expectedStep) return
            useAppStore.getState().setActiveCardId(demoCardId.current)
          }, 400)
        }
        break
      }
      case 'close-card':
        appStore.setActiveCardId(null)
        break
      case 'open-notes': {
        const expectedStep = stepRef.current
        showClickIndicatorAt('notes-btn')
        setTimeout(() => {
          if (stepRef.current !== expectedStep) return
          useAppStore.getState().setNotesOpen(true)
        }, 400)
        break
      }
      case 'close-notes':
        appStore.setNotesOpen(false)
        break
      case 'open-search': {
        const expectedStep = stepRef.current
        setTimeout(() => {
          if (stepRef.current !== expectedStep) return
          useAppStore.getState().setSearchPanelOpen(true)
        }, 300)
        break
      }
      case 'close-search':
        appStore.setSearchPanelOpen(false)
        break
      case 'open-archive': {
        const expectedStep = stepRef.current
        showClickIndicatorAt('archive-btn')
        setTimeout(() => {
          if (stepRef.current !== expectedStep) return
          useAppStore.getState().setArchivePanelOpen(true)
        }, 400)
        break
      }
      case 'close-archive':
        appStore.setArchivePanelOpen(false)
        break
      case 'open-settings': {
        const expectedStep = stepRef.current
        showClickIndicatorAt('settings-btn')
        setTimeout(() => {
          if (stepRef.current !== expectedStep) return
          useAppStore.getState().setSettingsOpen(true)
        }, 400)
        break
      }
      case 'close-settings':
        appStore.setSettingsOpen(false)
        break
      case 'open-automations': {
        if (automationsOpenSetter) {
          const expectedStep = stepRef.current
          setTimeout(() => {
            if (stepRef.current !== expectedStep) return
            automationsOpenSetter?.(true)
          }, 300)
        }
        break
      }
      case 'close-automations':
        if (automationsOpenSetter) automationsOpenSetter(false)
        break
    }
  }, [isRu])

  const showClickIndicatorAt = useCallback((target: string) => {
    const el = document.querySelector(`[data-tutorial="${target}"]`)
    if (el) {
      const rect = el.getBoundingClientRect()
      setClickIndicator({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 })
      setTimeout(() => setClickIndicator(null), 600)
    }
  }, [])

  // Close all panels helper
  const closeAllPanels = useCallback(() => {
    const s = useAppStore.getState()
    s.setActiveCardId(null)
    s.setNotesOpen(false)
    s.setSearchPanelOpen(false)
    s.setArchivePanelOpen(false)
    s.setSettingsOpen(false)
    if (automationsOpenSetter) automationsOpenSetter(false)
  }, [])

  // Execute actions when step changes
  useEffect(() => {
    if (!showOnboarding) return
    const cs = STEPS[step]
    if (cs.action) {
      const expectedStep = step
      const timer = setTimeout(() => {
        // Guard: only execute if still on the same step and tutorial is still active
        if (stepRef.current !== expectedStep || !useAppStore.getState().showOnboarding) return
        executeAction(cs.action!)
      }, 200)
      return () => clearTimeout(timer)
    }
  }, [step, showOnboarding, executeAction])

  // Resolve the DOM element to highlight
  const resolveHighlightEl = useCallback((cs: TutorialStep): HTMLElement | null => {
    const targetAttr = cs.panelTarget || cs.target
    if (!targetAttr) return null
    const el = document.querySelector(`[data-tutorial="${targetAttr}"]`) as HTMLElement | null
    if (!el) return null
    // For panel steps only: if the element is a full-screen backdrop, find the inner content div.
    // If the element itself IS the panel (e.g. archive sidebar), use it directly.
    if (cs.panelTarget) {
      const rect = el.getBoundingClientRect()
      const isFullScreen = rect.width >= window.innerWidth * 0.9 && rect.height >= window.innerHeight * 0.9
      if (isFullScreen) {
        const inner = el.querySelector(':scope > div:not(.fixed)') as HTMLElement | null
        return inner || el
      }
    }
    return el
  }, [])

  // Update highlight position for target or panelTarget
  useEffect(() => {
    if (!showOnboarding) return
    const cs = STEPS[step]
    const targetAttr = cs.panelTarget || cs.target
    if (targetAttr) {
      // Longer delay for panel steps (wait for panel to open + animation to finish)
      const delay = cs.action ? 1000 : 100
      const timer = setTimeout(() => {
        if (stepRef.current !== step) return
        const target = resolveHighlightEl(cs)
        setHighlight(target ? target.getBoundingClientRect() : null)
      }, delay)
      return () => clearTimeout(timer)
    } else {
      setHighlight(null)
    }
  }, [step, showOnboarding, resolveHighlightEl])

  // Recalculate on window resize
  useEffect(() => {
    if (!showOnboarding) return
    const handleResize = () => {
      const cs = STEPS[stepRef.current]
      const target = resolveHighlightEl(cs)
      if (target) setHighlight(target.getBoundingClientRect())
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [step, showOnboarding, resolveHighlightEl])

  const goNext = useCallback(() => {
    if (animating) return
    if (isLast) {
      closeAllPanels()
      setOnboardingComplete(true)
      setShowOnboarding(false)
      setStep(0)
      demoCreated.current = false
      playSuccess()
      return
    }
    // Close ALL panels first (prevents orphan panels from stale setTimeout)
    closeAllPanels()
    setAnimating(true)
    setHighlight(null)
    playClick()
    setTimeout(() => {
      setStep((s) => s + 1)
      setAnimating(false)
    }, 200)
  }, [animating, isLast, step, setOnboardingComplete, setShowOnboarding, closeAllPanels])

  const goPrev = useCallback(() => {
    if (animating || isFirst) return
    // Close ALL panels first (prevents orphan panels from stale setTimeout)
    closeAllPanels()
    setAnimating(true)
    setHighlight(null)
    playClick()
    setTimeout(() => {
      setStep((s) => s - 1)
      setAnimating(false)
    }, 200)
  }, [animating, isFirst, step, closeAllPanels])

  const handleSkip = useCallback(() => {
    closeAllPanels()
    // Keep the demo board so the user can explore it
    setOnboardingComplete(true)
    setShowOnboarding(false)
    setStep(0)
    demoCreated.current = false
  }, [setOnboardingComplete, setShowOnboarding, closeAllPanels])

  // Keyboard navigation
  useEffect(() => {
    if (!showOnboarding) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'Enter') { e.preventDefault(); goNext() }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); goPrev() }
      else if (e.key === 'Escape') handleSkip()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [showOnboarding, goNext, goPrev, handleSkip])

  if (!showOnboarding) return null

  // Tooltip positioning
  const getTooltipStyle = (): React.CSSProperties => {
    const tooltipW = Math.min(420, window.innerWidth - 32)

    // Panel mode: position in a corner so it doesn't cover the panel
    if (isPanelStep) {
      const pos = currentStep.tooltipPosition ?? 'bottom-right'
      return {
        position: 'fixed',
        bottom: 20,
        ...(pos === 'bottom-left' ? { left: 20 } : { right: 20 }),
        width: tooltipW
      }
    }

    const tooltipH = step === SHORTCUTS_STEP ? 340 : 240

    if (!highlight) {
      return {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: tooltipW
      }
    }

    const pad = 14
    const vw = window.innerWidth
    const vh = window.innerHeight
    const style: React.CSSProperties = { position: 'fixed', width: tooltipW }

    if (highlight.right + pad + tooltipW < vw) {
      style.left = highlight.right + pad
      style.top = Math.max(pad, Math.min(highlight.top, vh - tooltipH - pad))
    } else if (highlight.left - pad - tooltipW > 0) {
      style.left = highlight.left - pad - tooltipW
      style.top = Math.max(pad, Math.min(highlight.top, vh - tooltipH - pad))
    } else if (highlight.bottom + pad + tooltipH < vh) {
      style.top = highlight.bottom + pad
      style.left = Math.max(pad, Math.min(highlight.left, vw - tooltipW - pad))
    } else if (highlight.top - pad - tooltipH > 0) {
      style.top = highlight.top - pad - tooltipH
      style.left = Math.max(pad, Math.min(highlight.left, vw - tooltipW - pad))
    } else {
      style.top = '50%'
      style.left = '50%'
      style.transform = 'translate(-50%, -50%)'
    }

    return style
  }

  // Z-index strategy:
  // Panel steps: overlay at z-[48] (below panels at z-50)
  // Normal steps: overlay at z-[300]
  // Tooltip ALWAYS at z-[9999] so it's never covered by modal blur/backdrop
  const overlayZ = isPanelStep ? 'z-[48]' : 'z-[300]'
  const tooltipZ = 'z-[9999]'
  const indicatorZ = 'z-[9998]'
  const skipZ = 'z-[9999]'
  const highlightZ = isPanelStep ? 'z-[105]' : 'z-[305]'

  return (
    <>
      {/* Overlay container — its own stacking context */}
      <div className={cn('fixed inset-0', overlayZ)} style={{ isolation: 'isolate' }}>
        {/* Dark overlay: use simple div when no cutout needed (avoids SVG mask issues during re-renders) */}
        {highlight && !isPanelStep ? (
          <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'none' }}>
            <defs>
              <mask id="tutorial-mask">
                <rect width="100%" height="100%" fill="white" />
                <rect
                  x={highlight.left - 6}
                  y={highlight.top - 6}
                  width={highlight.width + 12}
                  height={highlight.height + 12}
                  rx={10}
                  fill="black"
                />
              </mask>
            </defs>
            <rect
              width="100%"
              height="100%"
              fill="rgba(0,0,0,0.6)"
              mask="url(#tutorial-mask)"
              style={{ pointerEvents: 'all' }}
              onClick={(e) => e.stopPropagation()}
            />
          </svg>
        ) : (
          <div
            className="absolute inset-0"
            style={{ backgroundColor: isPanelStep ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.6)' }}
            onClick={(e) => e.stopPropagation()}
          />
        )}

        {/* Glow border around highlighted element — smooth transitions */}
        {highlight && !isPanelStep && (
          <div
            className="fixed border-2 border-accent/80 rounded-xl pointer-events-none"
            style={{
              left: highlight.left - 6,
              top: highlight.top - 6,
              width: highlight.width + 12,
              height: highlight.height + 12,
              boxShadow: '0 0 16px rgba(var(--accent), 0.35), inset 0 0 16px rgba(var(--accent), 0.1)',
              animation: 'pulse 2s ease-in-out infinite',
              transition: 'left 0.35s ease, top 0.35s ease, width 0.35s ease, height 0.35s ease, opacity 0.25s ease'
            }}
          />
        )}
      </div>

      {/* Panel highlight glow — outside overlay so it's above panels */}
      {highlight && isPanelStep && (
        <div
          className={cn('fixed border-2 border-accent/80 rounded-xl pointer-events-none', highlightZ)}
          style={{
            left: highlight.left - 4,
            top: highlight.top - 4,
            width: highlight.width + 8,
            height: highlight.height + 8,
            boxShadow: '0 0 20px rgba(var(--accent), 0.4), inset 0 0 20px rgba(var(--accent), 0.1)',
            animation: 'pulse 2s ease-in-out infinite',
            transition: 'left 0.35s ease, top 0.35s ease, width 0.35s ease, height 0.35s ease, opacity 0.25s ease'
          }}
        />
      )}

      {/* Click indicator animation — outside stacking context */}
      {clickIndicator && (
        <div
          className={cn('fixed pointer-events-none', indicatorZ)}
          style={{ left: clickIndicator.x - 16, top: clickIndicator.y - 16 }}
        >
          <MousePointer2
            size={32}
            className="text-accent drop-shadow-lg"
            style={{ animation: 'tutorial-click 0.5s ease-out forwards' }}
          />
        </div>
      )}

      {/* Tooltip card — OUTSIDE the overlay stacking context so z-[9999] works globally */}
      <div
        className={cn(
          'fixed bg-surface-elevated border border-border rounded-2xl shadow-2xl overflow-hidden transition-all duration-200',
          tooltipZ,
          animating ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
        )}
        style={getTooltipStyle()}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5">
          <div className="flex items-center gap-3 mb-2.5">
            <div className="p-2 rounded-xl bg-accent/10 text-accent shrink-0">
              {currentStep.icon}
            </div>
            <h3 className="text-base font-bold text-content-primary leading-tight">
              {isRu ? currentStep.titleRu : currentStep.titleEn}
            </h3>
          </div>
          {step === SHORTCUTS_STEP ? (
            <ShortcutsGrid isRu={isRu} />
          ) : (
            <p className="text-[13px] text-content-secondary leading-relaxed whitespace-pre-line">
              {isRu ? currentStep.descRu : currentStep.descEn}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-surface-secondary/40">
          <div className="flex items-center gap-1">
            {STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  if (animating || i === step) return
                  closeAllPanels()
                  setAnimating(true)
                  setHighlight(null)
                  playClick()
                  setTimeout(() => {
                    setStep(i)
                    setAnimating(false)
                  }, 200)
                }}
                className={cn(
                  'transition-all duration-200 rounded-full',
                  i === step
                    ? 'w-5 h-1.5 bg-accent'
                    : i < step
                      ? 'w-1.5 h-1.5 bg-accent/50 hover:bg-accent/70'
                      : 'w-1.5 h-1.5 bg-content-tertiary/30 hover:bg-content-tertiary/50'
                )}
              />
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            {!isFirst && !isLast && (
              <button
                onClick={handleSkip}
                className="px-2 py-1 text-xs text-content-tertiary hover:text-content-secondary transition-colors"
              >
                {isRu ? 'Пропустить' : 'Skip'}
              </button>
            )}
            {!isFirst && (
              <button
                onClick={goPrev}
                className="p-1.5 rounded-lg text-content-secondary hover:text-content-primary hover:bg-surface-tertiary transition-colors"
              >
                <ArrowLeft size={15} />
              </button>
            )}
            <button
              onClick={goNext}
              className={cn(
                'flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                isLast
                  ? 'bg-green-600 hover:bg-green-500 text-white'
                  : 'bg-accent hover:bg-accent-hover text-white'
              )}
            >
              {isLast
                ? (isRu ? 'Начать!' : 'Start!')
                : isFirst
                  ? (isRu ? 'Поехали' : 'Let\'s go')
                  : (isRu ? 'Далее' : 'Next')
              }
              {!isLast && <ArrowRight size={13} />}
              {isLast && <Check size={13} />}
            </button>
          </div>
        </div>

        <div className="absolute top-2 right-3 text-[10px] text-content-tertiary font-mono">
          {step + 1}/{STEPS.length}
        </div>
      </div>

      {/* Top-right skip — outside stacking context */}
      {isFirst && (
        <button
          onClick={handleSkip}
          className={cn('fixed top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs text-white/60 hover:text-white bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-sm', skipZ)}
        >
          <X size={12} />
          {isRu ? 'Пропустить' : 'Skip'}
        </button>
      )}

      <style>{`
        @keyframes tutorial-click {
          0% { transform: translate(0, 0) scale(1); opacity: 1; }
          50% { transform: translate(4px, 4px) scale(0.85); opacity: 0.8; }
          100% { transform: translate(0, 0) scale(1); opacity: 0; }
        }
      `}</style>
    </>
  )
}
