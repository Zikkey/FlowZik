import { cn } from '@/lib/utils'

interface CheckboxProps {
  checked: boolean
  onChange: () => void
  className?: string
  size?: 'sm' | 'md'
}

export function Checkbox({ checked, onChange, className, size = 'md' }: CheckboxProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={(e) => { e.stopPropagation(); onChange() }}
      className={cn(
        'shrink-0 rounded border-2 transition-all duration-150 flex items-center justify-center cursor-pointer',
        size === 'sm' ? 'w-4 h-4 min-w-[16px] p-[1px]' : 'w-5 h-5 min-w-[20px] p-[2px]',
        checked
          ? 'bg-accent border-accent text-white'
          : 'border-content-tertiary/40 hover:border-accent/60 bg-transparent'
      , className)}
    >
      {checked && (
        <svg
          viewBox="0 0 12 12"
          fill="none"
          className={size === 'sm' ? 'w-2.5 h-2.5' : 'w-3 h-3'}
        >
          <path
            d="M2 6L5 9L10 3"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  )
}

interface ToggleProps {
  checked: boolean
  onChange: (val: boolean) => void
  className?: string
}

export function Toggle({ checked, onChange, className }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative w-9 h-5 rounded-full transition-colors duration-200 shrink-0',
        checked ? 'bg-accent' : 'bg-border',
        className
      )}
    >
      <span
        className={cn(
          'absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200',
          checked && 'translate-x-4'
        )}
      />
    </button>
  )
}
