import { useState, useCallback, useRef, useEffect } from 'react'
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
  const [dragging, setDragging] = useState(false)
  const [rect, setRect] = useState<Rect | null>(null)
  const startPos = useRef({ x: 0, y: 0 })
  const setSelection = useSelectionStore((s) => s.setSelection)
  const clearSelection = useSelectionStore((s) => s.clearSelection)
  const setIsSelecting = useSelectionStore((s) => s.setIsSelecting)

  const handleMouseDown = useCallback((e: MouseEvent) => {
    // Only activate on Shift + left click on the board background
    if (!e.shiftKey || e.button !== 0) return
    const target = e.target as HTMLElement
    // Don't start if clicking on a card or interactive element
    if (target.closest('[data-card]') || target.closest('button') || target.closest('input') || target.closest('textarea')) return

    e.preventDefault()
    const container = containerRef.current
    if (!container) return

    startPos.current = { x: e.clientX, y: e.clientY }
    setDragging(true)
    setIsSelecting(true)
    setRect({ x: e.clientX, y: e.clientY, w: 0, h: 0 })
  }, [containerRef, setIsSelecting])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragging) return

    const x = Math.min(e.clientX, startPos.current.x)
    const y = Math.min(e.clientY, startPos.current.y)
    const w = Math.abs(e.clientX - startPos.current.x)
    const h = Math.abs(e.clientY - startPos.current.y)

    setRect({ x, y, w, h })

    // Find overlapping cards
    const container = containerRef.current
    if (!container) return
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
    setSelection(ids)
  }, [dragging, containerRef, setSelection])

  const handleMouseUp = useCallback(() => {
    if (dragging) {
      setDragging(false)
      setRect(null)
      setIsSelecting(false)
    }
  }, [dragging, setIsSelecting])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    container.addEventListener('mousedown', handleMouseDown)
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    return () => {
      container.removeEventListener('mousedown', handleMouseDown)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [handleMouseDown, handleMouseMove, handleMouseUp, containerRef])

  // Clear selection on Escape or any click without Shift
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') clearSelection()
    }
    const handleClick = (e: MouseEvent) => {
      if (!e.shiftKey && useSelectionStore.getState().selectedCardIds.size > 0) {
        clearSelection()
      }
    }
    document.addEventListener('keydown', handleKey)
    document.addEventListener('click', handleClick)
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.removeEventListener('click', handleClick)
    }
  }, [clearSelection])

  if (!rect || !dragging) return null

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
