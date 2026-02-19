import { InputHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          'w-full h-8 px-3 text-sm rounded-md',
          'bg-surface-tertiary text-content-primary placeholder:text-content-tertiary',
          'border border-border focus:border-accent',
          'outline-none transition-colors duration-150',
          className
        )}
        {...props}
      />
    )
  }
)
Input.displayName = 'Input'
