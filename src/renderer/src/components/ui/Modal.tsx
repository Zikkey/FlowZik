import { ReactNode, useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { useAppStore } from '@/store'
import { cn } from '@/lib/utils'

interface ModalProps {
  open: boolean
  onClose: () => void
  children: ReactNode
  className?: string
  width?: string
  dataTutorial?: string
}

export function Modal({ open, onClose, children, className, width = 'max-w-2xl', dataTutorial }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handleEsc = (e: KeyboardEvent) => {
      // Don't close modals via Escape during tutorial
      if (useAppStore.getState().showOnboarding) return
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [open, onClose])

  if (!open) return null

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target !== overlayRef.current) return
    // Don't close modals by clicking outside during tutorial
    if (useAppStore.getState().showOnboarding) return
    onClose()
  }

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4 animate-fade-in"
      onMouseDown={handleOverlayClick}
      {...(dataTutorial ? { 'data-tutorial': dataTutorial } : {})}
    >
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm pointer-events-none" />
      <div
        className={cn(
          'relative w-full rounded-xl shadow-2xl animate-scale-in',
          'bg-surface-elevated border border-border',
          'max-h-[80vh] overflow-hidden flex flex-col',
          width,
          className
        )}
      >
        <button
          onClick={() => {
            if (useAppStore.getState().showOnboarding) return
            onClose()
          }}
          className="absolute top-3 right-3 p-1.5 rounded-md text-content-tertiary hover:text-content-primary hover:bg-surface-tertiary transition-colors z-10"
        >
          <X size={16} />
        </button>
        {children}
      </div>
    </div>
  )
}
