import { useEffect, useState } from 'react'
import { useToastStore, type Toast } from '@/store/toast-store'
import { useAppStore } from '@/store'
import { CheckCircle2, Info, AlertTriangle, XCircle, X } from 'lucide-react'
import { cn } from '@/lib/utils'

const ICONS: Record<Toast['type'], typeof Info> = {
  success: CheckCircle2,
  info: Info,
  warning: AlertTriangle,
  error: XCircle,
}

const ACCENT_COLORS: Record<Toast['type'], string> = {
  success: '#22c55e',
  info: 'rgb(var(--accent))',
  warning: '#f59e0b',
  error: '#ef4444',
}

const BG_COLORS: Record<Toast['type'], string> = {
  success: 'border-green-500/30 bg-surface-elevated',
  info: 'border-accent/30 bg-surface-elevated',
  warning: 'border-amber-500/30 bg-surface-elevated',
  error: 'border-red-500/30 bg-surface-elevated',
}

const ICON_COLORS: Record<Toast['type'], string> = {
  success: 'text-green-500',
  info: 'text-accent',
  warning: 'text-amber-500',
  error: 'text-red-500',
}

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts)
  const removeToast = useToastStore((s) => s.removeToast)
  const pauseToast = useToastStore((s) => s.pauseToast)
  const resumeToast = useToastStore((s) => s.resumeToast)
  const setActiveCardId = useAppStore((s) => s.setActiveCardId)
  const setActiveBoardId = useAppStore((s) => s.setActiveBoardId)
  const setShowDashboard = useAppStore((s) => s.setShowDashboard)

  if (toasts.length === 0) return null

  const handleClick = (toast: Toast) => {
    if (toast.cardId) {
      if (toast.boardId) {
        setActiveBoardId(toast.boardId)
        setShowDashboard(false)
      }
      setActiveCardId(toast.cardId)
      removeToast(toast.id)
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onRemove={() => removeToast(toast.id)}
          onPause={() => pauseToast(toast.id)}
          onResume={() => resumeToast(toast.id)}
          onClick={() => handleClick(toast)}
        />
      ))}
    </div>
  )
}

function ToastItem({ toast, onRemove, onPause, onResume, onClick }: {
  toast: Toast
  onRemove: () => void
  onPause: () => void
  onResume: () => void
  onClick: () => void
}) {
  const Icon = ICONS[toast.type]
  const [progress, setProgress] = useState(100)
  const [paused, setPaused] = useState(false)
  const hasAction = !!toast.cardId || !!toast.onAction

  useEffect(() => {
    const start = toast.createdAt
    const end = start + toast.duration
    let raf: number

    const update = () => {
      if (paused) { raf = requestAnimationFrame(update); return }
      const now = Date.now()
      const remaining = Math.max(0, ((end - now) / toast.duration) * 100)
      setProgress(remaining)
      if (remaining > 0) raf = requestAnimationFrame(update)
    }
    raf = requestAnimationFrame(update)
    return () => cancelAnimationFrame(raf)
  }, [toast.createdAt, toast.duration, paused])

  return (
    <div
      className={cn(
        'pointer-events-auto flex flex-col rounded-xl border shadow-2xl overflow-hidden',
        'animate-in slide-in-from-right-5 fade-in duration-200',
        'min-w-[280px] max-w-[380px]',
        hasAction && 'cursor-pointer',
        BG_COLORS[toast.type]
      )}
      onMouseEnter={() => { setPaused(true); onPause() }}
      onMouseLeave={() => { setPaused(false); onResume() }}
      onClick={hasAction ? onClick : undefined}
    >
      <div className="flex items-center gap-2.5 px-3.5 py-2.5">
        <div className={cn('shrink-0 w-7 h-7 rounded-lg flex items-center justify-center', ICON_COLORS[toast.type])}
          style={{ backgroundColor: `${ACCENT_COLORS[toast.type]}15` }}>
          <Icon size={15} />
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-sm text-content-primary leading-snug block">{toast.message}</span>
          {toast.actionLabel && toast.onAction && (
            <button
              onClick={(e) => { e.stopPropagation(); toast.onAction!(); onRemove() }}
              className="text-xs text-accent hover:underline mt-0.5"
            >
              {toast.actionLabel}
            </button>
          )}
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onRemove() }}
          className="shrink-0 p-1 rounded-md hover:bg-surface-tertiary text-content-tertiary hover:text-content-primary transition-colors"
        >
          <X size={12} />
        </button>
      </div>
      {/* Progress bar */}
      <div className="h-0.5 bg-surface-tertiary/50">
        <div
          className="h-full transition-none"
          style={{
            width: `${progress}%`,
            backgroundColor: ACCENT_COLORS[toast.type]
          }}
        />
      </div>
    </div>
  )
}
