import { useEffect, useRef } from 'react'
import { useAppStore } from '@/store'
import { ACCENT_COLORS, DARK_THEME_PRESETS, LIGHT_THEME_PRESETS } from '@/lib/constants'

const FONT_SIZE_MAP = { sm: '13px', md: '14px', lg: '16px' }

export function useTheme(): void {
  const theme = useAppStore((s) => s.theme)
  const accentColor = useAppStore((s) => s.accentColor)
  const fontSize = useAppStore((s) => s.fontSize)
  const themePreset = useAppStore((s) => s.themePreset)
  const uiScale = useAppStore((s) => s.uiScale)
  const glassCards = useAppStore((s) => s.glassCards)

  // Apply glass mode class
  useEffect(() => {
    document.documentElement.classList.toggle('glass-mode', glassCards)
  }, [glassCards])

  useEffect(() => {
    const root = document.documentElement

    function applyDark(isDark: boolean) {
      if (isDark) {
        root.classList.add('dark')
      } else {
        root.classList.remove('dark')
      }
    }

    if (theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      applyDark(mq.matches)
      const handler = (e: MediaQueryListEvent) => applyDark(e.matches)
      mq.addEventListener('change', handler)
      return () => mq.removeEventListener('change', handler)
    }

    applyDark(theme === 'dark')
  }, [theme])

  // Apply accent color
  useEffect(() => {
    const def = ACCENT_COLORS.find((c) => c.name === accentColor) ?? ACCENT_COLORS[0]
    const root = document.documentElement
    const isDark = root.classList.contains('dark')
    const palette = isDark ? def.dark : def.light

    root.style.setProperty('--accent', palette.accent)
    root.style.setProperty('--accent-hover', palette.hover)
    root.style.setProperty('--accent-subtle', palette.subtle)
  }, [accentColor, theme])

  // Apply theme preset (surface colors)
  useEffect(() => {
    const root = document.documentElement
    const isDark = root.classList.contains('dark')
    const presets = isDark ? DARK_THEME_PRESETS : LIGHT_THEME_PRESETS
    const preset = presets.find((p) => p.name === themePreset) ?? presets[0]

    root.style.setProperty('--bg-primary', preset.vars.bgPrimary)
    root.style.setProperty('--bg-secondary', preset.vars.bgSecondary)
    root.style.setProperty('--bg-tertiary', preset.vars.bgTertiary)
    root.style.setProperty('--bg-elevated', preset.vars.bgElevated)
    root.style.setProperty('--text-primary', preset.vars.textPrimary)
    root.style.setProperty('--text-secondary', preset.vars.textSecondary)
    root.style.setProperty('--text-tertiary', preset.vars.textTertiary)
    root.style.setProperty('--border-color', preset.vars.borderColor)
    root.style.setProperty('--border-hover', preset.vars.borderHover)
  }, [themePreset, theme])

  // Apply font size
  useEffect(() => {
    document.documentElement.style.fontSize = FONT_SIZE_MAP[fontSize] ?? '14px'
  }, [fontSize])

  // Apply UI scale via Electron's native zoom (respects viewport units)
  const scaleTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (scaleTimer.current) clearTimeout(scaleTimer.current)
    scaleTimer.current = setTimeout(() => {
      window.electronAPI.setZoomFactor(uiScale)
    }, 50)
    return () => { if (scaleTimer.current) clearTimeout(scaleTimer.current) }
  }, [uiScale])
}
