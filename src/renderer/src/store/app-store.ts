import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { electronStoreStorage } from './storage-adapter'
import { createId } from '@/lib/id'
import type { Theme, Language, ViewMode } from '@/types'
import type { Priority } from '@/types'

export interface TitlebarPin {
  id: string
  type: 'board'
  targetId: string
  label: string
  emoji?: string
}

export interface BoardFolder {
  id: string
  name: string
  collapsed: boolean
}

interface AppState {
  theme: Theme
  language: Language
  sidebarOpen: boolean
  activeBoardId: string | null
  activeCardId: string | null
  archivePanelOpen: boolean
  accentColor: string
  viewMode: ViewMode
  notificationsEnabled: boolean
  compactCards: boolean
  defaultPriority: Priority
  settingsOpen: boolean
  searchPanelOpen: boolean
  showDashboard: boolean
  notesOpen: boolean
  focusedCardId: string | null
  collapsedColumnIds: string[]

  // Theme color preset
  themePreset: string
  uiScale: number              // 0.85-1.2

  // Notification options
  notifyOverdue: boolean
  notifyDueToday: boolean
  notifyDueSoon: boolean
  notifyOnComplete: boolean
  notificationInterval: number  // minutes

  // Deep customization
  boardBackground: string       // 'none' | 'dots' | 'grid' | 'lines' | hex color | 'image:<path>'
  cardBorderRadius: 'sm' | 'md' | 'lg'
  fontSize: 'sm' | 'md' | 'lg'
  showCardBadges: boolean
  showCardDates: boolean
  showCardSubtasks: boolean
  showCardAttachmentCount: boolean
  columnWidth: number
  soundEnabled: boolean
  glassCards: boolean
  cardDensity: 'compact' | 'comfortable' | 'spacious'

  setTheme: (theme: Theme) => void
  toggleTheme: () => void
  setLanguage: (lang: Language) => void
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  setActiveBoardId: (id: string | null) => void
  setActiveCardId: (id: string | null) => void
  setArchivePanelOpen: (open: boolean) => void
  setAccentColor: (name: string) => void
  setViewMode: (mode: ViewMode) => void
  setNotificationsEnabled: (val: boolean) => void
  setCompactCards: (val: boolean) => void
  setDefaultPriority: (p: Priority) => void
  setSettingsOpen: (open: boolean) => void
  setSearchPanelOpen: (open: boolean) => void
  setShowDashboard: (show: boolean) => void
  setNotesOpen: (open: boolean) => void
  setFocusedCardId: (id: string | null) => void
  toggleColumnCollapse: (id: string) => void

  setThemePreset: (name: string) => void
  setUiScale: (s: number) => void
  setNotifyOverdue: (v: boolean) => void
  setNotifyDueToday: (v: boolean) => void
  setNotifyDueSoon: (v: boolean) => void
  setNotifyOnComplete: (v: boolean) => void
  setNotificationInterval: (m: number) => void
  setBoardBackground: (bg: string) => void
  setCardBorderRadius: (r: 'sm' | 'md' | 'lg') => void
  setFontSize: (s: 'sm' | 'md' | 'lg') => void
  setShowCardBadges: (v: boolean) => void
  setShowCardDates: (v: boolean) => void
  setShowCardSubtasks: (v: boolean) => void
  setShowCardAttachmentCount: (v: boolean) => void
  setColumnWidth: (w: number) => void
  setSoundEnabled: (v: boolean) => void
  setGlassCards: (v: boolean) => void
  setCardDensity: (d: 'compact' | 'comfortable' | 'spacious') => void

  // Titlebar pins
  titlebarPins: TitlebarPin[]
  addTitlebarPin: (pin: Omit<TitlebarPin, 'id'>) => void
  removeTitlebarPin: (id: string) => void
  reorderTitlebarPins: (pins: TitlebarPin[]) => void

  // Board folders
  boardFolders: BoardFolder[]
  createBoardFolder: (name: string) => string
  renameBoardFolder: (id: string, name: string) => void
  deleteBoardFolder: (id: string) => void
  toggleBoardFolder: (id: string) => void

  // Quick add bar
  quickAddOpen: boolean
  setQuickAddOpen: (v: boolean) => void

  // Onboarding tutorial
  onboardingComplete: boolean
  showOnboarding: boolean
  setOnboardingComplete: (v: boolean) => void
  setShowOnboarding: (v: boolean) => void
  restartOnboarding: () => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      theme: 'dark',
      language: (navigator.language?.startsWith('ru') ? 'ru' : 'en') as 'en' | 'ru',
      sidebarOpen: true,
      activeBoardId: null,
      activeCardId: null,
      archivePanelOpen: false,
      accentColor: 'indigo',
      viewMode: 'kanban',
      notificationsEnabled: true,
      compactCards: false,
      defaultPriority: 'none',
      settingsOpen: false,
      searchPanelOpen: false,
      showDashboard: false,
      notesOpen: false,
      focusedCardId: null,
      collapsedColumnIds: [],

      themePreset: 'default',
      uiScale: 1,

      notifyOverdue: true,
      notifyDueToday: true,
      notifyDueSoon: false,
      notifyOnComplete: false,
      notificationInterval: 30,

      boardBackground: 'none',
      cardBorderRadius: 'md',
      fontSize: 'md',
      showCardBadges: true,
      showCardDates: true,
      showCardSubtasks: true,
      showCardAttachmentCount: true,
      columnWidth: 300,
      soundEnabled: true,
      glassCards: false,
      cardDensity: 'comfortable' as const,

      setTheme: (theme) => set({ theme }),
      toggleTheme: () => set((s) => {
        if (s.theme === 'dark') return { theme: 'light' }
        if (s.theme === 'light') return { theme: 'system' }
        return { theme: 'dark' }
      }),
      setLanguage: (lang) => set({ language: lang }),
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setActiveBoardId: (id) => set({ activeBoardId: id, ...(id ? { showDashboard: false } : {}) }),
      setActiveCardId: (id) => set({ activeCardId: id }),
      setArchivePanelOpen: (open) => set({ archivePanelOpen: open }),
      setAccentColor: (name) => set({ accentColor: name }),
      setViewMode: (mode) => set({ viewMode: mode }),
      setNotificationsEnabled: (val) => set({ notificationsEnabled: val }),
      setCompactCards: (val) => set({ compactCards: val }),
      setDefaultPriority: (p) => set({ defaultPriority: p }),
      setSettingsOpen: (open) => set({ settingsOpen: open }),
      setSearchPanelOpen: (open) => set({ searchPanelOpen: open }),
      setShowDashboard: (show) => set({ showDashboard: show }),
      setNotesOpen: (open) => set({ notesOpen: open }),
      setFocusedCardId: (id) => set({ focusedCardId: id }),
      toggleColumnCollapse: (id) => set((s) => ({
        collapsedColumnIds: s.collapsedColumnIds.includes(id)
          ? s.collapsedColumnIds.filter((c) => c !== id)
          : [...s.collapsedColumnIds, id]
      })),

      setThemePreset: (name) => set({ themePreset: name }),
      setUiScale: (s) => set({ uiScale: s }),
      setNotifyOverdue: (v) => set({ notifyOverdue: v }),
      setNotifyDueToday: (v) => set({ notifyDueToday: v }),
      setNotifyDueSoon: (v) => set({ notifyDueSoon: v }),
      setNotifyOnComplete: (v) => set({ notifyOnComplete: v }),
      setNotificationInterval: (m) => set({ notificationInterval: m }),
      setBoardBackground: (bg) => set({ boardBackground: bg }),
      setCardBorderRadius: (r) => set({ cardBorderRadius: r }),
      setFontSize: (s) => set({ fontSize: s }),
      setShowCardBadges: (v) => set({ showCardBadges: v }),
      setShowCardDates: (v) => set({ showCardDates: v }),
      setShowCardSubtasks: (v) => set({ showCardSubtasks: v }),
      setShowCardAttachmentCount: (v) => set({ showCardAttachmentCount: v }),
      setColumnWidth: (w) => set({ columnWidth: w }),
      setSoundEnabled: (v) => set({ soundEnabled: v }),
      setGlassCards: (v) => set({ glassCards: v }),
      setCardDensity: (d) => set({ cardDensity: d }),

      boardFolders: [],
      createBoardFolder: (name) => {
        const id = `folder-${createId()}`
        set((s) => ({ boardFolders: [...s.boardFolders, { id, name, collapsed: false }] }))
        return id
      },
      renameBoardFolder: (id, name) => set((s) => ({
        boardFolders: s.boardFolders.map((f) => f.id === id ? { ...f, name } : f)
      })),
      deleteBoardFolder: (id) => set((s) => ({
        boardFolders: s.boardFolders.filter((f) => f.id !== id)
      })),
      toggleBoardFolder: (id) => set((s) => ({
        boardFolders: s.boardFolders.map((f) => f.id === id ? { ...f, collapsed: !f.collapsed } : f)
      })),

      titlebarPins: [],
      addTitlebarPin: (pin) => set((s) => ({
        titlebarPins: [...s.titlebarPins, { ...pin, id: `pin-${createId()}` }]
      })),
      removeTitlebarPin: (id) => set((s) => ({
        titlebarPins: s.titlebarPins.filter((p) => p.id !== id)
      })),
      reorderTitlebarPins: (pins) => set({ titlebarPins: pins }),

      quickAddOpen: false,
      setQuickAddOpen: (v) => set({ quickAddOpen: v }),

      onboardingComplete: false,
      showOnboarding: false,
      setOnboardingComplete: (v) => set({ onboardingComplete: v }),
      setShowOnboarding: (v) => set({ showOnboarding: v }),
      restartOnboarding: () => set({ onboardingComplete: false, showOnboarding: true })
    }),
    {
      name: 'flowzik-app-settings',
      storage: createJSONStorage(() => electronStoreStorage),
      partialize: (state) => ({
        theme: state.theme,
        language: state.language,
        sidebarOpen: state.sidebarOpen,
        activeBoardId: state.activeBoardId,
        accentColor: state.accentColor,
        viewMode: state.viewMode,
        notificationsEnabled: state.notificationsEnabled,
        compactCards: state.compactCards,
        defaultPriority: state.defaultPriority,
        themePreset: state.themePreset,
        uiScale: state.uiScale,
        notifyOverdue: state.notifyOverdue,
        notifyDueToday: state.notifyDueToday,
        notifyDueSoon: state.notifyDueSoon,
        notifyOnComplete: state.notifyOnComplete,
        notificationInterval: state.notificationInterval,
        collapsedColumnIds: state.collapsedColumnIds,
        boardBackground: state.boardBackground,
        cardBorderRadius: state.cardBorderRadius,
        fontSize: state.fontSize,
        showCardBadges: state.showCardBadges,
        showCardDates: state.showCardDates,
        showCardSubtasks: state.showCardSubtasks,
        showCardAttachmentCount: state.showCardAttachmentCount,
        columnWidth: state.columnWidth,
        soundEnabled: state.soundEnabled,
        glassCards: state.glassCards,
        cardDensity: state.cardDensity,
        titlebarPins: state.titlebarPins,
        boardFolders: state.boardFolders,
        onboardingComplete: state.onboardingComplete
      })
    }
  )
)
