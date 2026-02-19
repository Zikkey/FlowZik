import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 px-4 text-center', className)}>
      <div className="w-12 h-12 rounded-xl bg-surface-tertiary flex items-center justify-center mb-4">
        <Icon size={24} className="text-content-tertiary" />
      </div>
      <h3 className="text-sm font-medium text-content-primary mb-1">{title}</h3>
      {description && (
        <p className="text-xs text-content-tertiary max-w-[240px] mb-4">{description}</p>
      )}
      {action}
    </div>
  )
}
