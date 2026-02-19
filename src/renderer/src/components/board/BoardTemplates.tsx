import { LayoutDashboard, Repeat, User, Briefcase, Code, Lightbulb, Rocket, GraduationCap } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { useBoardStore, useAppStore } from '@/store'
import { useTranslation } from '@/hooks/use-translation'
import { cn } from '@/lib/utils'

interface BoardTemplatesProps {
  open: boolean
  onClose: () => void
}

interface BoardTemplate {
  id: string
  icon: React.ReactNode
  nameEn: string
  nameRu: string
  descEn: string
  descRu: string
  columns: { titleEn: string; titleRu: string; color?: string }[]
}

const TEMPLATES: BoardTemplate[] = [
  {
    id: 'kanban',
    icon: <LayoutDashboard size={24} />,
    nameEn: 'Kanban',
    nameRu: 'Канбан',
    descEn: 'Classic Kanban board with To Do, In Progress, Done',
    descRu: 'Классическая канбан-доска',
    columns: [
      { titleEn: 'To Do', titleRu: 'К выполнению', color: '#3b82f6' },
      { titleEn: 'In Progress', titleRu: 'В работе', color: '#eab308' },
      { titleEn: 'Done', titleRu: 'Готово', color: '#22c55e' }
    ]
  },
  {
    id: 'scrum',
    icon: <Repeat size={24} />,
    nameEn: 'Scrum Sprint',
    nameRu: 'Скрам-спринт',
    descEn: 'Sprint board with Backlog, Sprint, In Review, Done',
    descRu: 'Спринт-доска с бэклогом и ревью',
    columns: [
      { titleEn: 'Backlog', titleRu: 'Бэклог' },
      { titleEn: 'Sprint', titleRu: 'Спринт', color: '#3b82f6' },
      { titleEn: 'In Progress', titleRu: 'В работе', color: '#eab308' },
      { titleEn: 'In Review', titleRu: 'На ревью', color: '#8b5cf6' },
      { titleEn: 'Done', titleRu: 'Готово', color: '#22c55e' }
    ]
  },
  {
    id: 'personal',
    icon: <User size={24} />,
    nameEn: 'Personal',
    nameRu: 'Личная',
    descEn: 'Personal task board with priorities',
    descRu: 'Личная доска задач',
    columns: [
      { titleEn: 'Ideas', titleRu: 'Идеи', color: '#8b5cf6' },
      { titleEn: 'To Do', titleRu: 'Сделать', color: '#3b82f6' },
      { titleEn: 'Doing', titleRu: 'Делаю', color: '#eab308' },
      { titleEn: 'Done', titleRu: 'Готово', color: '#22c55e' }
    ]
  },
  {
    id: 'project',
    icon: <Briefcase size={24} />,
    nameEn: 'Project Management',
    nameRu: 'Управление проектом',
    descEn: 'Full project lifecycle tracking',
    descRu: 'Отслеживание жизненного цикла проекта',
    columns: [
      { titleEn: 'Planning', titleRu: 'Планирование', color: '#6b7280' },
      { titleEn: 'Design', titleRu: 'Дизайн', color: '#ec4899' },
      { titleEn: 'Development', titleRu: 'Разработка', color: '#3b82f6' },
      { titleEn: 'Testing', titleRu: 'Тестирование', color: '#eab308' },
      { titleEn: 'Review', titleRu: 'Ревью', color: '#8b5cf6' },
      { titleEn: 'Deployed', titleRu: 'Запущено', color: '#22c55e' }
    ]
  },
  {
    id: 'dev',
    icon: <Code size={24} />,
    nameEn: 'Software Dev',
    nameRu: 'Разработка ПО',
    descEn: 'Bug tracking and feature development',
    descRu: 'Баг-трекинг и разработка фич',
    columns: [
      { titleEn: 'Bugs', titleRu: 'Баги', color: '#ef4444' },
      { titleEn: 'Features', titleRu: 'Фичи', color: '#3b82f6' },
      { titleEn: 'In Progress', titleRu: 'В работе', color: '#eab308' },
      { titleEn: 'Code Review', titleRu: 'Код ревью', color: '#8b5cf6' },
      { titleEn: 'Merged', titleRu: 'Смержено', color: '#22c55e' }
    ]
  },
  {
    id: 'brainstorm',
    icon: <Lightbulb size={24} />,
    nameEn: 'Brainstorm',
    nameRu: 'Мозговой штурм',
    descEn: 'Idea generation and evaluation',
    descRu: 'Генерация и оценка идей',
    columns: [
      { titleEn: 'Raw Ideas', titleRu: 'Сырые идеи', color: '#f97316' },
      { titleEn: 'Promising', titleRu: 'Перспективные', color: '#eab308' },
      { titleEn: 'Researching', titleRu: 'Исследуем', color: '#3b82f6' },
      { titleEn: 'Approved', titleRu: 'Одобрено', color: '#22c55e' }
    ]
  },
  {
    id: 'launch',
    icon: <Rocket size={24} />,
    nameEn: 'Product Launch',
    nameRu: 'Запуск продукта',
    descEn: 'Track tasks for a product launch',
    descRu: 'Отслеживание задач перед запуском',
    columns: [
      { titleEn: 'Pre-Launch', titleRu: 'До запуска', color: '#6b7280' },
      { titleEn: 'Marketing', titleRu: 'Маркетинг', color: '#ec4899' },
      { titleEn: 'Development', titleRu: 'Разработка', color: '#3b82f6' },
      { titleEn: 'QA', titleRu: 'Тестирование', color: '#eab308' },
      { titleEn: 'Launched', titleRu: 'Запущено', color: '#22c55e' }
    ]
  },
  {
    id: 'study',
    icon: <GraduationCap size={24} />,
    nameEn: 'Study Plan',
    nameRu: 'Учебный план',
    descEn: 'Organize learning materials and progress',
    descRu: 'Учебные материалы и прогресс',
    columns: [
      { titleEn: 'To Learn', titleRu: 'Изучить', color: '#3b82f6' },
      { titleEn: 'Studying', titleRu: 'Изучаю', color: '#eab308' },
      { titleEn: 'Practice', titleRu: 'Практика', color: '#8b5cf6' },
      { titleEn: 'Mastered', titleRu: 'Освоено', color: '#22c55e' }
    ]
  }
]

export function BoardTemplates({ open, onClose }: BoardTemplatesProps) {
  const { t } = useTranslation()
  const lang = t('sidebar.boards') === 'Доски' ? 'ru' : 'en'
  const createBoard = useBoardStore((s) => s.createBoard)
  const createColumn = useBoardStore((s) => s.createColumn)
  const updateColumn = useBoardStore((s) => s.updateColumn)
  const setActiveBoardId = useAppStore((s) => s.setActiveBoardId)

  const handleSelect = (template: BoardTemplate) => {
    const boardTitle = lang === 'ru' ? template.nameRu : template.nameEn
    const boardId = createBoard(boardTitle)

    for (const col of template.columns) {
      const colTitle = lang === 'ru' ? col.titleRu : col.titleEn
      const colId = createColumn(boardId, colTitle)
      if (col.color) {
        updateColumn(colId, { color: col.color })
      }
    }

    setActiveBoardId(boardId)
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} width="max-w-2xl">
      <div className="p-6 overflow-y-auto max-h-[80vh]">
        <h2 className="text-lg font-bold text-content-primary mb-4">
          {lang === 'ru' ? 'Шаблоны досок' : 'Board Templates'}
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {TEMPLATES.map((template) => (
            <button
              key={template.id}
              onClick={() => handleSelect(template)}
              className="flex items-start gap-3 p-4 rounded-lg border border-border hover:border-accent hover:bg-accent/5 transition-colors text-left group"
            >
              <div className="p-2 rounded-lg bg-surface-tertiary text-content-secondary group-hover:text-accent transition-colors shrink-0">
                {template.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm text-content-primary group-hover:text-accent transition-colors">
                  {lang === 'ru' ? template.nameRu : template.nameEn}
                </div>
                <div className="text-xs text-content-tertiary mt-0.5">
                  {lang === 'ru' ? template.descRu : template.descEn}
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {template.columns.map((col, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center text-[9px] leading-tight px-1.5 py-0.5 rounded border whitespace-nowrap"
                      style={col.color ? {
                        backgroundColor: `${col.color}12`,
                        borderColor: `${col.color}30`,
                        color: col.color
                      } : {
                        backgroundColor: 'rgb(var(--surface-tertiary))',
                        borderColor: 'rgb(var(--border-color))',
                        color: 'rgb(var(--content-tertiary))'
                      }}
                    >
                      {col.color && <span className="w-1.5 h-1.5 rounded-full mr-1 shrink-0" style={{ backgroundColor: col.color }} />}
                      {lang === 'ru' ? col.titleRu : col.titleEn}
                    </span>
                  ))}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </Modal>
  )
}
