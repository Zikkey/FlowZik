import { useState } from 'react'
import {
  Sun, Moon, Monitor, Palette, Globe, Bell, CreditCard,
  Keyboard, Layout
} from 'lucide-react'
import { createId } from '@/lib/id'
import { useAppStore } from '@/store'
import { Modal } from '@/components/ui/Modal'
import { Toggle } from '@/components/ui/Checkbox'
import { ACCENT_COLORS, PRIORITY_CONFIG, DARK_THEME_PRESETS, LIGHT_THEME_PRESETS, BOARD_BG_COLORS } from '@/lib/constants'
import { useTranslation } from '@/hooks/use-translation'
import { cn } from '@/lib/utils'
import type { Theme, Language } from '@/types'
import type { Priority } from '@/types'

type SettingsSection = 'appearance' | 'customization' | 'language' | 'notifications' | 'cards' | 'keybinds'

interface SectionDef {
  id: SettingsSection
  icon: typeof Palette
  labelEn: string
  labelRu: string
}

const SECTIONS: SectionDef[] = [
  { id: 'appearance', icon: Palette, labelEn: 'Appearance', labelRu: 'Внешний вид' },
  { id: 'customization', icon: Layout, labelEn: 'Customization', labelRu: 'Кастомизация' },
  { id: 'language', icon: Globe, labelEn: 'Language', labelRu: 'Язык' },
  { id: 'notifications', icon: Bell, labelEn: 'Notifications', labelRu: 'Уведомления' },
  { id: 'cards', icon: CreditCard, labelEn: 'Cards', labelRu: 'Карточки' },
  { id: 'keybinds', icon: Keyboard, labelEn: 'Keyboard shortcuts', labelRu: 'Горячие клавиши' },
]

export function SettingsModal() {
  const { t } = useTranslation()
  const lang = t('sidebar.boards') === 'Доски' ? 'ru' : 'en'
  const settingsOpen = useAppStore((s) => s.settingsOpen)
  const setSettingsOpen = useAppStore((s) => s.setSettingsOpen)
  const [activeSection, setActiveSection] = useState<SettingsSection>('appearance')

  return (
    <Modal open={settingsOpen} onClose={() => setSettingsOpen(false)} width="max-w-3xl" dataTutorial="settings-modal">
      <div className="flex h-[75vh] overflow-hidden">
        {/* Sidebar */}
        <div className="w-48 shrink-0 bg-surface-secondary border-r border-border p-3 overflow-y-auto">
          <h2 className="text-xs font-semibold text-content-tertiary uppercase tracking-wider px-2 mb-3">
            {lang === 'ru' ? 'Настройки' : 'Settings'}
          </h2>
          <nav className="space-y-0.5">
            {SECTIONS.map((section) => {
              const Icon = section.icon
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={cn(
                    'w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors text-left',
                    activeSection === section.id
                      ? 'bg-accent/10 text-accent font-medium'
                      : 'text-content-secondary hover:bg-surface-tertiary hover:text-content-primary'
                  )}
                >
                  <Icon size={14} />
                  {lang === 'ru' ? section.labelRu : section.labelEn}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeSection === 'appearance' && <AppearanceSection lang={lang} />}
          {activeSection === 'customization' && <CustomizationSection lang={lang} />}
          {activeSection === 'language' && <LanguageSection lang={lang} />}
          {activeSection === 'notifications' && <NotificationsSection lang={lang} />}
          {activeSection === 'cards' && <CardsSection lang={lang} />}
          {activeSection === 'keybinds' && <KeybindsSection lang={lang} />}
        </div>
      </div>
    </Modal>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-lg font-bold text-content-primary mb-4">{children}</h3>
}

function SectionGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h4 className="text-xs font-semibold text-content-tertiary uppercase tracking-wider mb-3">{title}</h4>
      <div className="space-y-4">{children}</div>
    </div>
  )
}

function SettingsRow({ label, desc, children }: { label: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <div className="text-sm text-content-primary">{label}</div>
        {desc && <div className="text-xs text-content-tertiary mt-0.5">{desc}</div>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

// ========================
// SECTIONS
// ========================

function AppearanceSection({ lang }: { lang: string }) {
  const theme = useAppStore((s) => s.theme)
  const setTheme = useAppStore((s) => s.setTheme)
  const accentColor = useAppStore((s) => s.accentColor)
  const setAccentColor = useAppStore((s) => s.setAccentColor)
  const themePreset = useAppStore((s) => s.themePreset)
  const setThemePreset = useAppStore((s) => s.setThemePreset)

  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  const presets = isDark ? DARK_THEME_PRESETS : LIGHT_THEME_PRESETS

  const themes: { value: Theme; label: string; icon: typeof Sun }[] = [
    { value: 'light', label: lang === 'ru' ? 'Светлая' : 'Light', icon: Sun },
    { value: 'dark', label: lang === 'ru' ? 'Тёмная' : 'Dark', icon: Moon },
    { value: 'system', label: lang === 'ru' ? 'Системная' : 'System', icon: Monitor },
  ]

  return (
    <>
      <SectionTitle>{lang === 'ru' ? 'Внешний вид' : 'Appearance'}</SectionTitle>

      <SectionGroup title={lang === 'ru' ? 'Тема' : 'Theme'}>
        <div className="flex gap-2">
          {themes.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => setTheme(value)}
              className={cn(
                'flex-1 flex flex-col items-center gap-2 px-3 py-3 rounded-xl border-2 transition-all',
                theme === value
                  ? 'border-accent bg-accent/5 shadow-sm'
                  : 'border-border hover:border-border-hover'
              )}
            >
              <Icon size={20} className={theme === value ? 'text-accent' : 'text-content-tertiary'} />
              <span className={cn('text-sm', theme === value ? 'text-accent font-medium' : 'text-content-secondary')}>
                {label}
              </span>
            </button>
          ))}
        </div>
      </SectionGroup>

      <SectionGroup title={lang === 'ru' ? 'Цветовая схема' : 'Color scheme'}>
        <div className="grid grid-cols-2 gap-2">
          {presets.map((preset) => (
            <button
              key={preset.name}
              onClick={() => setThemePreset(preset.name)}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2.5 rounded-xl border-2 transition-all text-left',
                themePreset === preset.name
                  ? 'border-accent bg-accent/5'
                  : 'border-border hover:border-border-hover'
              )}
            >
              <div className="flex overflow-hidden rounded shrink-0 w-8 h-8 border border-white/10">
                <div className="flex-1" style={{ backgroundColor: `rgb(${preset.vars.bgPrimary})` }} />
                <div className="flex-1" style={{ backgroundColor: `rgb(${preset.vars.bgSecondary})` }} />
                <div className="flex-1" style={{ backgroundColor: `rgb(${preset.vars.bgTertiary})` }} />
              </div>
              <span className={cn(
                'text-xs truncate',
                themePreset === preset.name ? 'text-accent font-medium' : 'text-content-secondary'
              )}>
                {lang === 'ru' ? preset.labelRu : preset.label}
              </span>
            </button>
          ))}
        </div>
        <p className="text-xs text-content-tertiary mt-1">
          {lang === 'ru'
            ? 'Меняет цвета фона, боковой панели и других поверхностей'
            : 'Changes background, sidebar and surface colors'}
        </p>
      </SectionGroup>

      <SectionGroup title={lang === 'ru' ? 'Основной цвет' : 'Accent color'}>
        <div className="flex flex-wrap gap-2.5">
          {ACCENT_COLORS.map((color) => (
            <button
              key={color.name}
              onClick={() => setAccentColor(color.name)}
              title={color.label}
              className={cn(
                'w-9 h-9 rounded-full border-2 transition-all hover:scale-110 relative',
                accentColor === color.name ? 'border-content-primary scale-110 shadow-lg' : 'border-transparent'
              )}
              style={{ backgroundColor: `rgb(${color.light.accent})` }}
            >
              {accentColor === color.name && (
                <svg className="absolute inset-0 m-auto w-4 h-4 text-white" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              )}
            </button>
          ))}
        </div>
        <p className="text-xs text-content-tertiary mt-1">
          {lang === 'ru' ? 'Влияет на кнопки, выделения и акцентные элементы' : 'Affects buttons, highlights and accent elements'}
        </p>
      </SectionGroup>
    </>
  )
}

function CustomizationSection({ lang }: { lang: string }) {
  const boardBackground = useAppStore((s) => s.boardBackground)
  const setBoardBackground = useAppStore((s) => s.setBoardBackground)
  const cardBorderRadius = useAppStore((s) => s.cardBorderRadius)
  const setCardBorderRadius = useAppStore((s) => s.setCardBorderRadius)
  const fontSize = useAppStore((s) => s.fontSize)
  const setFontSize = useAppStore((s) => s.setFontSize)
  const cardDensity = useAppStore((s) => s.cardDensity)
  const setCardDensity = useAppStore((s) => s.setCardDensity)
  const showCardBadges = useAppStore((s) => s.showCardBadges)
  const setShowCardBadges = useAppStore((s) => s.setShowCardBadges)
  const showCardDates = useAppStore((s) => s.showCardDates)
  const setShowCardDates = useAppStore((s) => s.setShowCardDates)
  const showCardSubtasks = useAppStore((s) => s.showCardSubtasks)
  const setShowCardSubtasks = useAppStore((s) => s.setShowCardSubtasks)
  const showCardAttachmentCount = useAppStore((s) => s.showCardAttachmentCount)
  const setShowCardAttachmentCount = useAppStore((s) => s.setShowCardAttachmentCount)
  const columnWidth = useAppStore((s) => s.columnWidth)
  const setColumnWidth = useAppStore((s) => s.setColumnWidth)
  const uiScale = useAppStore((s) => s.uiScale)
  const setUiScale = useAppStore((s) => s.setUiScale)
  const glassCards = useAppStore((s) => s.glassCards)
  const setGlassCards = useAppStore((s) => s.setGlassCards)
  const focusMode = useAppStore((s) => s.focusMode)
  const setFocusMode = useAppStore((s) => s.setFocusMode)

  const bgOptions = [
    { value: 'none', label: lang === 'ru' ? 'Нет' : 'None' },
    { value: 'dots', label: lang === 'ru' ? 'Точки' : 'Dots' },
    { value: 'grid', label: lang === 'ru' ? 'Сетка' : 'Grid' },
    { value: 'lines', label: lang === 'ru' ? 'Линии' : 'Lines' },
    { value: 'crosshatch', label: lang === 'ru' ? 'Штрих' : 'Crosshatch' },
    { value: 'diamonds', label: lang === 'ru' ? 'Ромбы' : 'Diamonds' },
    { value: 'zigzag', label: lang === 'ru' ? 'Зигзаг' : 'Zigzag' },
    { value: 'anim-dots', label: lang === 'ru' ? '✨ Точки' : '✨ Dots' },
    { value: 'anim-grid', label: lang === 'ru' ? '✨ Сетка' : '✨ Grid' },
    { value: 'anim-diamonds', label: lang === 'ru' ? '✨ Ромбы' : '✨ Diamonds' },
    { value: 'anim-waves', label: lang === 'ru' ? '✨ Волны' : '✨ Waves' },
  ]

  const handleChooseBgImage = async () => {
    const paths = await (window as any).electronAPI.openAttachmentDialog()
    if (paths?.[0]) {
      const destFileName = `bg-${createId()}-${paths[0].split(/[/\\]/).pop()}`
      const destPath = await (window as any).electronAPI.copyAttachment(paths[0], destFileName)
      setBoardBackground(`image:${destPath}`)
    }
  }

  const radiusOptions: { value: 'sm' | 'md' | 'lg'; label: string }[] = [
    { value: 'sm', label: lang === 'ru' ? 'Маленький' : 'Small' },
    { value: 'md', label: lang === 'ru' ? 'Средний' : 'Medium' },
    { value: 'lg', label: lang === 'ru' ? 'Большой' : 'Large' },
  ]

  const fontOptions: { value: 'sm' | 'md' | 'lg'; label: string }[] = [
    { value: 'sm', label: lang === 'ru' ? 'Маленький' : 'Small' },
    { value: 'md', label: lang === 'ru' ? 'Средний' : 'Medium' },
    { value: 'lg', label: lang === 'ru' ? 'Большой' : 'Large' },
  ]

  return (
    <>
      <SectionTitle>{lang === 'ru' ? 'Кастомизация' : 'Customization'}</SectionTitle>

      <SectionGroup title={lang === 'ru' ? 'Эффекты' : 'Effects'}>
        <SettingsRow label={lang === 'ru' ? 'Режим стекла' : 'Glass mode'}
          desc={lang === 'ru' ? 'Glassmorphism — размытие и прозрачность по всему интерфейсу' : 'Glassmorphism — frosted blur across the entire UI'}
        >
          <Toggle checked={glassCards} onChange={setGlassCards} />
        </SettingsRow>
        <SettingsRow label={lang === 'ru' ? 'Фокус-режим' : 'Focus mode'}
          desc={lang === 'ru' ? 'Минимальный интерфейс — убраны лишние кнопки, колонки ближе друг к другу' : 'Minimal UI — hides extra buttons, tighter column spacing'}
        >
          <Toggle checked={focusMode} onChange={setFocusMode} />
        </SettingsRow>
      </SectionGroup>

      <SectionGroup title={lang === 'ru' ? 'Доска' : 'Board'}>
        <div>
          <label className="text-sm text-content-secondary mb-2 block">
            {lang === 'ru' ? 'Фон доски' : 'Board background'}
          </label>
          <div className="flex flex-wrap gap-1.5">
            {bgOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setBoardBackground(opt.value)}
                className={cn(
                  'px-2.5 py-1.5 rounded-lg text-xs border transition-colors',
                  boardBackground === opt.value
                    ? 'border-accent bg-accent/10 text-accent'
                    : 'border-border text-content-secondary hover:border-border-hover'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {/* Board background colors */}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {BOARD_BG_COLORS.map((color) => (
              <button
                key={color}
                onClick={() => setBoardBackground(color)}
                className={cn(
                  'w-6 h-6 rounded-md border-2 transition-all hover:scale-110',
                  boardBackground === color ? 'border-accent scale-110' : 'border-transparent'
                )}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
          {/* Background image */}
          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={handleChooseBgImage}
              className="px-3 py-1.5 rounded-lg text-xs border border-border text-content-secondary hover:border-border-hover transition-colors"
            >
              {lang === 'ru' ? 'Выбрать изображение' : 'Choose image'}
            </button>
            {boardBackground.startsWith('image:') && (
              <button
                onClick={() => setBoardBackground('none')}
                className="px-3 py-1.5 rounded-lg text-xs border border-border text-red-500 hover:border-red-500 transition-colors"
              >
                {lang === 'ru' ? 'Убрать' : 'Remove'}
              </button>
            )}
          </div>
        </div>

        <SettingsRow
          label={lang === 'ru' ? 'Ширина колонки' : 'Column width'}
          desc={`${columnWidth}px`}
        >
          <input
            type="range"
            min={260}
            max={420}
            step={10}
            value={columnWidth}
            onChange={(e) => setColumnWidth(Number(e.target.value))}
            className="w-32 accent-[rgb(var(--accent))]"
          />
        </SettingsRow>
      </SectionGroup>

      <SectionGroup title={lang === 'ru' ? 'Карточки' : 'Cards'}>
        <div>
          <label className="text-sm text-content-secondary mb-2 block">
            {lang === 'ru' ? 'Скругление углов' : 'Border radius'}
          </label>
          <div className="flex gap-2">
            {radiusOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setCardBorderRadius(opt.value)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs border transition-colors',
                  cardBorderRadius === opt.value
                    ? 'border-accent bg-accent/10 text-accent'
                    : 'border-border text-content-secondary hover:border-border-hover'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm text-content-secondary mb-2 block">
            {lang === 'ru' ? 'Плотность карточек' : 'Card density'}
          </label>
          <div className="flex gap-2">
            {([
              { value: 'compact' as const, labelEn: 'Compact', labelRu: 'Компактно' },
              { value: 'comfortable' as const, labelEn: 'Comfortable', labelRu: 'Комфортно' },
              { value: 'spacious' as const, labelEn: 'Spacious', labelRu: 'Просторно' },
            ]).map((opt) => (
              <button
                key={opt.value}
                onClick={() => setCardDensity(opt.value)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs border transition-colors',
                  cardDensity === opt.value
                    ? 'border-accent bg-accent/10 text-accent'
                    : 'border-border text-content-secondary hover:border-border-hover'
                )}
              >
                {lang === 'ru' ? opt.labelRu : opt.labelEn}
              </button>
            ))}
          </div>
        </div>

        <SettingsRow label={lang === 'ru' ? 'Показывать метки' : 'Show labels'}>
          <Toggle checked={showCardBadges} onChange={setShowCardBadges} />
        </SettingsRow>

        <SettingsRow label={lang === 'ru' ? 'Показывать даты' : 'Show dates'}>
          <Toggle checked={showCardDates} onChange={setShowCardDates} />
        </SettingsRow>

        <SettingsRow label={lang === 'ru' ? 'Показывать подзадачи' : 'Show subtasks'}>
          <Toggle checked={showCardSubtasks} onChange={setShowCardSubtasks} />
        </SettingsRow>

        <SettingsRow label={lang === 'ru' ? 'Показывать вложения' : 'Show attachments count'}>
          <Toggle checked={showCardAttachmentCount} onChange={setShowCardAttachmentCount} />
        </SettingsRow>
      </SectionGroup>

      <SectionGroup title={lang === 'ru' ? 'Шрифт и масштаб' : 'Font & Scale'}>
        <div>
          <label className="text-sm text-content-secondary mb-2 block">
            {lang === 'ru' ? 'Размер шрифта' : 'Font size'}
          </label>
          <div className="flex gap-2">
            {fontOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setFontSize(opt.value)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs border transition-colors',
                  fontSize === opt.value
                    ? 'border-accent bg-accent/10 text-accent'
                    : 'border-border text-content-secondary hover:border-border-hover'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <SettingsRow
          label={lang === 'ru' ? 'Масштаб интерфейса' : 'UI Scale'}
          desc={`${Math.round(uiScale * 100)}%`}
        >
          <input
            type="range"
            min={0.85}
            max={1.2}
            step={0.05}
            value={uiScale}
            onChange={(e) => setUiScale(Number(e.target.value))}
            className="w-32 accent-[rgb(var(--accent))]"
          />
        </SettingsRow>
      </SectionGroup>
    </>
  )
}

function LanguageSection({ lang }: { lang: string }) {
  const language = useAppStore((s) => s.language)
  const setLanguage = useAppStore((s) => s.setLanguage)

  const languages: { value: Language; label: string }[] = [
    { value: 'en', label: 'English' },
    { value: 'ru', label: 'Русский' },
  ]

  return (
    <>
      <SectionTitle>{lang === 'ru' ? 'Язык' : 'Language'}</SectionTitle>
      <div className="space-y-2">
        {languages.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setLanguage(value)}
            className={cn(
              'w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all text-left',
              language === value
                ? 'border-accent bg-accent/5'
                : 'border-border hover:border-border-hover'
            )}
          >
            <span className="text-xl">{value === 'en' ? '🇬🇧' : '🇷🇺'}</span>
            <span className={cn('text-sm', language === value ? 'text-accent font-medium' : 'text-content-secondary')}>
              {label}
            </span>
          </button>
        ))}
      </div>
    </>
  )
}

function NotificationsSection({ lang }: { lang: string }) {
  const notificationsEnabled = useAppStore((s) => s.notificationsEnabled)
  const setNotificationsEnabled = useAppStore((s) => s.setNotificationsEnabled)
  const soundEnabled = useAppStore((s) => s.soundEnabled)
  const setSoundEnabled = useAppStore((s) => s.setSoundEnabled)
  const notifyOverdue = useAppStore((s) => s.notifyOverdue)
  const setNotifyOverdue = useAppStore((s) => s.setNotifyOverdue)
  const notifyDueToday = useAppStore((s) => s.notifyDueToday)
  const setNotifyDueToday = useAppStore((s) => s.setNotifyDueToday)
  const notifyDueSoon = useAppStore((s) => s.notifyDueSoon)
  const setNotifyDueSoon = useAppStore((s) => s.setNotifyDueSoon)
  const notifyOnComplete = useAppStore((s) => s.notifyOnComplete)
  const setNotifyOnComplete = useAppStore((s) => s.setNotifyOnComplete)
  const notificationInterval = useAppStore((s) => s.notificationInterval)
  const setNotificationInterval = useAppStore((s) => s.setNotificationInterval)

  return (
    <>
      <SectionTitle>{lang === 'ru' ? 'Уведомления' : 'Notifications'}</SectionTitle>

      <SectionGroup title={lang === 'ru' ? 'Общие' : 'General'}>
        <SettingsRow
          label={lang === 'ru' ? 'Системные уведомления' : 'System notifications'}
          desc={lang === 'ru' ? 'Включить/выключить все уведомления' : 'Enable/disable all notifications'}
        >
          <Toggle checked={notificationsEnabled} onChange={setNotificationsEnabled} />
        </SettingsRow>

        <SettingsRow
          label={lang === 'ru' ? 'Звуки интерфейса' : 'UI sounds'}
          desc={lang === 'ru' ? 'Звуки кликов, перетаскивания, уведомлений' : 'Click, drag, and notification sounds'}
        >
          <Toggle checked={soundEnabled} onChange={setSoundEnabled} />
        </SettingsRow>

        <SettingsRow
          label={lang === 'ru' ? 'Интервал проверки' : 'Check interval'}
          desc={`${notificationInterval} ${lang === 'ru' ? 'мин' : 'min'}`}
        >
          <input
            type="range"
            min={5}
            max={120}
            step={5}
            value={notificationInterval}
            onChange={(e) => setNotificationInterval(Number(e.target.value))}
            className="w-32 accent-[rgb(var(--accent))]"
            disabled={!notificationsEnabled}
          />
        </SettingsRow>
      </SectionGroup>

      <SectionGroup title={lang === 'ru' ? 'Типы уведомлений' : 'Notification types'}>
        <SettingsRow
          label={lang === 'ru' ? 'Просроченные карточки' : 'Overdue cards'}
        >
          <Toggle checked={notifyOverdue} onChange={setNotifyOverdue} />
        </SettingsRow>

        <SettingsRow
          label={lang === 'ru' ? 'Карточки на сегодня' : 'Cards due today'}
        >
          <Toggle checked={notifyDueToday} onChange={setNotifyDueToday} />
        </SettingsRow>

        <SettingsRow
          label={lang === 'ru' ? 'Карточки на ближайшие 24ч' : 'Cards due soon (24h)'}
        >
          <Toggle checked={notifyDueSoon} onChange={setNotifyDueSoon} />
        </SettingsRow>

        <SettingsRow
          label={lang === 'ru' ? 'Завершение карточки' : 'Card completion'}
        >
          <Toggle checked={notifyOnComplete} onChange={setNotifyOnComplete} />
        </SettingsRow>
      </SectionGroup>
    </>
  )
}

function CardsSection({ lang }: { lang: string }) {
  const defaultPriority = useAppStore((s) => s.defaultPriority)
  const setDefaultPriority = useAppStore((s) => s.setDefaultPriority)
  const priorityKeys: Priority[] = ['none', 'low', 'medium', 'high', 'urgent']
  const { t } = useTranslation()

  return (
    <>
      <SectionTitle>{lang === 'ru' ? 'Карточки' : 'Cards'}</SectionTitle>
      <SectionGroup title={lang === 'ru' ? 'Поведение' : 'Behavior'}>
        <div>
          <label className="text-sm text-content-secondary mb-2 block">
            {lang === 'ru' ? 'Приоритет по умолчанию' : 'Default priority'}
          </label>
          <div className="flex gap-1.5">
            {priorityKeys.map((p) => (
              <button
                key={p}
                onClick={() => setDefaultPriority(p)}
                className={cn(
                  'px-2.5 py-1.5 rounded-lg text-xs border transition-colors',
                  defaultPriority === p
                    ? 'border-accent bg-accent/10'
                    : 'border-border hover:border-border-hover',
                  PRIORITY_CONFIG[p].color
                )}
              >
                {t(`priority.${p}` as any)}
              </button>
            ))}
          </div>
          <p className="text-xs text-content-tertiary mt-2">
            {lang === 'ru'
              ? 'Новые карточки будут создаваться с этим приоритетом'
              : 'New cards will be created with this priority'}
          </p>
        </div>
      </SectionGroup>
    </>
  )
}

function KeybindsSection({ lang }: { lang: string }) {
  const shortcuts = [
    { keys: 'Ctrl+Space', descEn: 'Open search / command palette', descRu: 'Открыть поиск / палитру команд' },
    { keys: 'Ctrl+K', descEn: 'Open search panel', descRu: 'Открыть панель поиска' },
    { keys: 'Ctrl+Q', descEn: 'Quick add card', descRu: 'Быстрое создание карточки' },
    { keys: 'Ctrl+B', descEn: 'Create new board', descRu: 'Создать новую доску' },
    { keys: 'Ctrl+N', descEn: 'Toggle notes panel', descRu: 'Открыть/закрыть заметки' },
    { keys: 'Ctrl+Z', descEn: 'Undo', descRu: 'Отменить' },
    { keys: 'Ctrl+Shift+Z', descEn: 'Redo', descRu: 'Повторить' },
    { keys: '↑ ↓ ← →', descEn: 'Navigate between cards', descRu: 'Навигация по карточкам' },
    { keys: 'Enter', descEn: 'Open focused card', descRu: 'Открыть выбранную карточку' },
    { keys: 'Escape', descEn: 'Close modal / Clear selection', descRu: 'Закрыть / Сбросить выделение' },
    { keys: 'Ctrl+C', descEn: 'Copy selected cards', descRu: 'Копировать выбранные карточки' },
    { keys: 'Ctrl+V', descEn: 'Paste cards into hovered column', descRu: 'Вставить карточки в колонку' },
    { keys: 'Shift+Drag', descEn: 'Select multiple cards', descRu: 'Выделение нескольких карточек' },
    { keys: 'Right click', descEn: 'Context menu (single/bulk)', descRu: 'Контекстное меню (одна/несколько)' },
    { keys: 'Ctrl+Enter', descEn: 'Send comment', descRu: 'Отправить комментарий' },
    { keys: 'Double click', descEn: 'Rename board / column', descRu: 'Переименовать доску / колонку' },
  ]

  return (
    <>
      <SectionTitle>{lang === 'ru' ? 'Горячие клавиши' : 'Keyboard shortcuts'}</SectionTitle>
      <p className="text-xs text-content-tertiary mb-4">
        {lang === 'ru'
          ? 'Список доступных горячих клавиш для быстрой навигации'
          : 'Available keyboard shortcuts for quick navigation'}
      </p>
      <div className="space-y-1">
        {shortcuts.map((shortcut, i) => (
          <div
            key={i}
            className={cn(
              'flex items-center justify-between py-2.5 px-3 rounded-lg',
              i % 2 === 0 && 'bg-surface-tertiary/30'
            )}
          >
            <span className="text-sm text-content-primary">
              {lang === 'ru' ? shortcut.descRu : shortcut.descEn}
            </span>
            <kbd className="px-2 py-1 bg-surface-tertiary border border-border rounded text-xs font-mono text-content-secondary">
              {shortcut.keys}
            </kbd>
          </div>
        ))}
      </div>

      {/* Tutorial restart */}
      <div className="mt-6 pt-4 border-t border-border">
        <SectionTitle>{lang === 'ru' ? 'Туториал' : 'Tutorial'}</SectionTitle>
        <p className="text-xs text-content-tertiary mb-3">
          {lang === 'ru'
            ? 'Пройдите интерактивный тур по приложению ещё раз'
            : 'Walk through the interactive app tour again'}
        </p>
        <button
          onClick={() => {
            useAppStore.getState().restartOnboarding()
            useAppStore.getState().setSettingsOpen(false)
          }}
          className="px-4 py-2 rounded-lg bg-accent/10 text-accent text-sm font-medium hover:bg-accent/20 transition-colors"
        >
          {lang === 'ru' ? 'Перезапустить туториал' : 'Restart tutorial'}
        </button>
      </div>
    </>
  )
}
