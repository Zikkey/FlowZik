import { useState, useRef, useEffect } from 'react'
import { Plus } from 'lucide-react'
import { useBoardStore } from '@/store'
import { useTranslation } from '@/hooks/use-translation'

interface AddColumnButtonProps {
  boardId: string
}

export function AddColumnButton({ boardId }: AddColumnButtonProps) {
  const { t } = useTranslation()
  const [adding, setAdding] = useState(false)
  const [title, setTitle] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const createColumn = useBoardStore((s) => s.createColumn)

  useEffect(() => {
    if (adding && inputRef.current) {
      inputRef.current.focus()
    }
  }, [adding])

  const handleSubmit = () => {
    if (title.trim()) {
      createColumn(boardId, title.trim())
      setTitle('')
      inputRef.current?.focus()
    } else {
      setAdding(false)
      setTitle('')
    }
  }

  if (!adding) {
    return (
      <button
        onClick={() => setAdding(true)}
        className="w-[300px] min-w-[300px] h-10 flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border text-sm text-content-tertiary hover:border-accent/50 hover:text-accent hover:bg-accent/5 transition-all shrink-0"
      >
        <Plus size={16} /> {t('column.addColumn')}
      </button>
    )
  }

  return (
    <div className="w-[300px] min-w-[300px] shrink-0">
      <input
        ref={inputRef}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSubmit()
          if (e.key === 'Escape') { setAdding(false); setTitle('') }
        }}
        onBlur={handleSubmit}
        placeholder={t('column.columnTitle')}
        className="w-full h-10 px-4 rounded-xl bg-surface-secondary border border-border text-sm text-content-primary placeholder:text-content-tertiary outline-none focus:border-accent"
      />
    </div>
  )
}
