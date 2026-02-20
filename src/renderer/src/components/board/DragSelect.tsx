import { useState, useRef, useEffect } from 'react'
import { useSelectionStore } from '@/hooks/use-selection'

interface Rect {
  x: number
  y: number
  w: number
  h: number
}

function rectsOverlap(a: Rect, b: DOMRect): boolean {
  return !(a.x + a.w < b.left || a.x > b.right || a.y + a.h < b.top || a.y > b.bottom)
}

interface DragSelectProps {
  containerRef: React.RefObject<HTMLDivElement | null>
}

export function DragSelect({ containerRef }: DragSelectProps) {
  const [rect, setRect] = useState<Rect | null>(null)
  const draggingRef = useRef(false)
  const startPos = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleMouseDown = (e: MouseEvent) => {
      if (!e.shiftKey || e.button !== 0) return
      const target = e.target as HTMLElement
      if (target.closest('[data-card]') || target.closest('button') || target.closest('input') || target.closest('textarea')) return

      e.preventDefault()
      startPos.current = { x: e.clientX, y: e.clientY }
      draggingRef.current = true
      useSelectionStore.getState().setIsSelecting(true)
      setRect({ x: e.clientX, y: e.clientY, w: 0, h: 0 })
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!draggingRef.current) return

      const x = Math.min(e.clientX, startPos.current.x)
      const y = Math.min(e.clientY, startPos.current.y)
      const w = Math.abs(e.clientX - startPos.current.x)
      const h = Math.abs(e.clientY - startPos.current.y)

      setRect({ x, y, w, h })

      const cardEls = container.querySelectorAll('[data-card]')
      const selRect: Rect = { x, y, w, h }
      const ids: string[] = []
      cardEls.forEach((el) => {
        const elRect = el.getBoundingClientRect()
        const cardId = (el as HTMLElement).dataset.card
        if (cardId && rectsOverlap(selRect, elRect)) {
          ids.push(cardId)
        }
      })
      useSelectionStore.getState().setSelection(ids)
    }

    const handleMouseUp = () => {
      if (draggingRef.current) {
        draggingRef.current = false
        setRect(null)
        useSelectionStore.getState().setIsSelecting(false)
      }
    }

    container.addEventListener('mousedown', handleMouseDown)
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    return () => {
      container.removeEventListener('mousedown', handleMouseDown)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [containerRef])

  // Clear selection on Escape or click without Shift on non-card area
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') useSelectionStore.getState().clearSelection()
    }
    const handleClick = (e: MouseEvent) => {
      if (e.shiftKey) return
      if (useSelectionStore.getState().selectedCardIds.size === 0) return
      // Don't clear if clicking on a card (card handles its own selection)
      const target = e.target as HTMLElement
      if (target.closest('[data-card]')) return
      useSelectionStore.getState().clearSelection()
    }
    document.addEventListener('keydown', handleKey)
    document.addEventListener('click', handleClick)
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.removeEventListener('click', handleClick)
    }
  }, [])

  if (!rect) return null

  return (
    <div
      className="fixed pointer-events-none z-50 border-2 border-accent/60 bg-accent/10 rounded"
      style={{
        left: rect.x,
        top: rect.y,
        width: rect.w,
        height: rect.h
      }}
    />
  )
}
