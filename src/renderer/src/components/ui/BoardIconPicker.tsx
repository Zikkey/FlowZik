import { useState, useRef, useEffect } from 'react'
import * as LucideIcons from 'lucide-react'
import { BOARD_ICONS } from '@/lib/board-icons'
import { useAppStore } from '@/store'
import { cn } from '@/lib/utils'

function toPascalCase(str: string): string {
  return str.split('-').map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join('')
}

function getIcon(name: string, size: number) {
  const pascal = toPascalCase(name) as keyof typeof LucideIcons
  const Icon = LucideIcons[pascal] as React.FC<{ size?: number; className?: string }>
  if (!Icon) return null
  return <Icon size={size} />
}

interface BoardIconPickerProps {
  value?: string
  onChange: (icon: string | undefined) => void
  trigger?: React.ReactNode
}

export function BoardIconPicker({ value, onChange, trigger }: BoardIconPickerProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const isRu = useAppStore((s) => s.language) === 'ru'

  useEffect(() => {
    if (!open) return
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-center w-7 h-7 rounded-md hover:bg-surface-tertiary transition-colors text-content-secondary hover:text-content-primary"
      >
        {trigger ?? (value ? getIcon(value, 16) : <LucideIcons.Smile size={16} className="opacity-40" />)}
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 bg-surface-elevated border border-border rounded-xl shadow-xl p-2 w-[260px] animate-scale-in">
          {value && (
            <button
              onClick={() => { onChange(undefined); setOpen(false) }}
              className="w-full text-xs text-content-tertiary hover:text-content-primary px-2 py-1 mb-1 rounded hover:bg-surface-tertiary text-left"
            >
              {isRu ? 'Убрать иконку' : 'Remove icon'}
            </button>
          )}
          <div className="grid grid-cols-8 gap-0.5 max-h-[200px] overflow-y-auto scrollbar-thin">
            {BOARD_ICONS.map((name) => (
              <button
                key={name}
                onClick={() => { onChange(name); setOpen(false) }}
                className={cn(
                  'flex items-center justify-center w-7 h-7 rounded-md transition-colors',
                  value === name
                    ? 'bg-accent/15 text-accent'
                    : 'text-content-secondary hover:bg-surface-tertiary hover:text-content-primary'
                )}
                title={name}
              >
                {getIcon(name, 15)}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export function BoardIcon({ name, size = 14, className }: { name?: string; size?: number; className?: string }) {
  if (!name) return <LucideIcons.LayoutDashboard size={size} className={className} />
  const icon = getIcon(name, size)
  return icon ? <span className={className}>{icon}</span> : <LucideIcons.LayoutDashboard size={size} className={className} />
}
