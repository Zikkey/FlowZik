import { cn } from '@/lib/utils'

interface BadgeProps {
  color?: string
  emoji?: string
  children: React.ReactNode
  className?: string
  onClick?: () => void
  removable?: boolean
  onRemove?: () => void
}

export function Badge({ color, emoji, children, className, onClick, removable, onRemove }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
        onClick && 'cursor-pointer',
        className
      )}
      style={color ? { backgroundColor: `${color}20`, color } : undefined}
      onClick={onClick}
    >
      {emoji && <span>{emoji}</span>}
      {children}
      {removable && (
        <button
          onClick={(e) => { e.stopPropagation(); onRemove?.() }}
          className="ml-0.5 hover:opacity-70"
        >
          &times;
        </button>
      )}
    </span>
  )
}
