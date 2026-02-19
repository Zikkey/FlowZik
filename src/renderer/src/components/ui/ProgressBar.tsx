import { cn } from '@/lib/utils'

interface ProgressBarProps {
  value: number
  max: number
  className?: string
}

export function ProgressBar({ value, max, className }: ProgressBarProps) {
  const percent = max === 0 ? 0 : Math.round((value / max) * 100)
  const isComplete = value === max && max > 0

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="flex-1 h-1.5 rounded-full bg-surface-tertiary overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-300',
            isComplete ? 'bg-green-500' : 'bg-accent'
          )}
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className={cn(
        'text-xs tabular-nums',
        isComplete ? 'text-green-500' : 'text-content-tertiary'
      )}>
        {value}/{max}
      </span>
    </div>
  )
}
