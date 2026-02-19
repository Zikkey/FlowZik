import { useState, useRef, useCallback, useEffect } from 'react'
import { X, GripVertical, Palette } from 'lucide-react'
import { useStickyStore } from '@/store/sticky-store'
import { useAppStore } from '@/store'
import { cn } from '@/lib/utils'
import type { StickyNote } from '@/types'

const STICKY_COLORS = ['#fef08a', '#fda4af', '#93c5fd', '#86efac', '#c4b5fd', '#fdba74']

export function BoardStickyNote({ note }: { note: StickyNote }) {
  const updateStickyNote = useStickyStore((s) => s.updateStickyNote)
  const deleteStickyNote = useStickyStore((s) => s.deleteStickyNote)
  const lang = useAppStore((s) => s.language)

  const [editing, setEditing] = useState(!note.text)
  const [text, setText] = useState(note.text)
  const [dragging, setDragging] = useState(false)
  const [showColors, setShowColors] = useState(false)
  const dragStart = useRef({ x: 0, y: 0, noteX: 0, noteY: 0 })
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (editing && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [editing])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('textarea, button, [data-no-drag]')) return
    e.preventDefault()
    e.stopPropagation()
    setDragging(true)
    dragStart.current = { x: e.clientX, y: e.clientY, noteX: note.x, noteY: note.y }
  }, [note.x, note.y])

  useEffect(() => {
    if (!dragging) return
    const handleMove = (e: MouseEvent) => {
      const dx = e.clientX - dragStart.current.x
      const dy = e.clientY - dragStart.current.y
      updateStickyNote(note.id, {
        x: Math.max(0, dragStart.current.noteX + dx),
        y: Math.max(0, dragStart.current.noteY + dy)
      })
    }
    const handleUp = () => setDragging(false)
    document.addEventListener('mousemove', handleMove)
    document.addEventListener('mouseup', handleUp)
    return () => {
      document.removeEventListener('mousemove', handleMove)
      document.removeEventListener('mouseup', handleUp)
    }
  }, [dragging, note.id, updateStickyNote])

  const handleBlur = () => {
    setEditing(false)
    if (text !== note.text) {
      updateStickyNote(note.id, { text })
    }
    // Delete empty sticky notes
    if (!text.trim()) {
      deleteStickyNote(note.id)
    }
  }

  return (
    <div
      className={cn(
        'absolute rounded-lg shadow-lg border border-black/10 flex flex-col group',
        dragging ? 'cursor-grabbing opacity-80 z-50' : 'cursor-grab z-30'
      )}
      style={{
        left: note.x,
        top: note.y,
        width: note.width,
        minHeight: note.height,
        backgroundColor: note.color
      }}
      onMouseDown={handleMouseDown}
      data-no-board-ctx
    >
      {/* Header with drag handle */}
      <div className="flex items-center justify-between px-2 pt-1.5 pb-0.5">
        <GripVertical size={12} className="text-black/20" />
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            data-no-drag
            onClick={(e) => { e.stopPropagation(); setShowColors(!showColors) }}
            className="w-5 h-5 flex items-center justify-center rounded hover:bg-black/10 transition-colors"
          >
            <Palette size={11} className="text-black/40" />
          </button>
          <button
            data-no-drag
            onClick={(e) => { e.stopPropagation(); deleteStickyNote(note.id) }}
            className="w-5 h-5 flex items-center justify-center rounded hover:bg-black/10 transition-colors"
          >
            <X size={11} className="text-black/40" />
          </button>
        </div>
      </div>

      {/* Color picker */}
      {showColors && (
        <div className="flex gap-1 px-2 pb-1" data-no-drag>
          {STICKY_COLORS.map((c) => (
            <button
              key={c}
              onClick={(e) => {
                e.stopPropagation()
                updateStickyNote(note.id, { color: c })
                setShowColors(false)
              }}
              className={cn(
                'w-5 h-5 rounded-full border-2 transition-all hover:scale-110',
                c === note.color ? 'border-black/40 scale-110' : 'border-transparent'
              )}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      )}

      {/* Content */}
      {editing ? (
        <textarea
          ref={textareaRef}
          data-no-drag
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={(e) => {
            if (e.key === 'Escape') handleBlur()
          }}
          className="flex-1 bg-transparent text-xs text-black/80 resize-none outline-none px-2 pb-2 placeholder:text-black/30"
          placeholder={lang === 'ru' ? 'Заметка...' : 'Note...'}
          style={{ minHeight: note.height - 30 }}
        />
      ) : (
        <div
          data-no-drag
          className="flex-1 px-2 pb-2 text-xs text-black/80 whitespace-pre-wrap cursor-text overflow-hidden"
          onDoubleClick={() => setEditing(true)}
          style={{ minHeight: note.height - 30 }}
        >
          {note.text || (
            <span className="text-black/30 italic">
              {lang === 'ru' ? 'Двойной клик для редактирования' : 'Double-click to edit'}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
