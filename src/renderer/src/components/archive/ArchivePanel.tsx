import { useState } from 'react'
import { X, RotateCcw, Trash2, Columns, CreditCard } from 'lucide-react'
import { useAppStore, useBoardStore, useArchiveStore } from '@/store'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { formatTimestamp } from '@/lib/date'
import { useTranslation } from '@/hooks/use-translation'
import { cn } from '@/lib/utils'

export function ArchivePanel() {
  const { t } = useTranslation()
  const archivePanelOpen = useAppStore((s) => s.archivePanelOpen)
  const setArchivePanelOpen = useAppStore((s) => s.setArchivePanelOpen)
  const activeBoardId = useAppStore((s) => s.activeBoardId)

  const boards = useBoardStore((s) => s.boards)
  const columns = useBoardStore((s) => s.columns)

  const archivedCards = useArchiveStore((s) => s.archivedCards)
  const archivedColumns = useArchiveStore((s) => s.archivedColumns)
  const restoreCard = useArchiveStore((s) => s.restoreCard)
  const deleteArchivedCard = useArchiveStore((s) => s.deleteArchivedCard)
  const restoreColumn = useArchiveStore((s) => s.restoreColumn)
  const deleteArchivedColumn = useArchiveStore((s) => s.deleteArchivedColumn)

  const createColumn = useBoardStore((s) => s.createColumn)
  const createCard = useBoardStore((s) => s.createCard)
  const updateCard = useBoardStore((s) => s.updateCard)

  const [tab, setTab] = useState<'cards' | 'columns'>('cards')
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'card' | 'column'; id: string } | null>(null)

  if (!archivePanelOpen) return null

  const board = activeBoardId ? boards[activeBoardId] : null
  const boardArchivedCards = Object.values(archivedCards).filter(
    (c) => !activeBoardId || c.boardId === activeBoardId
  )
  const boardArchivedColumns = Object.values(archivedColumns).filter(
    (c) => !activeBoardId || c.boardId === activeBoardId
  )

  const handleRestoreCard = (id: string) => {
    if (!activeBoardId) return
    const restored = restoreCard(id)
    if (!restored) return

    // Find the original column or the first column
    const targetColumnId = columns[restored.originalColumnId]
      ? restored.originalColumnId
      : board?.columnOrder[0]

    if (targetColumnId) {
      const newId = createCard(targetColumnId, restored.title)
      updateCard(newId, {
        description: restored.description,
        labels: restored.labels,
        priority: restored.priority,
        dueDate: restored.dueDate,
        subtasks: restored.subtasks,
        checklists: restored.checklists,
        comments: restored.comments,
        attachments: restored.attachments,
        completed: restored.completed,
        pinned: restored.pinned,
        coverImageId: restored.coverImageId
      })
    }
  }

  const handleRestoreColumn = (id: string) => {
    if (!activeBoardId) return
    const restored = restoreColumn(id)
    if (!restored) return
    const newColId = createColumn(activeBoardId, restored.title)
    for (const card of restored.cards) {
      const newCardId = createCard(newColId, card.title)
      updateCard(newCardId, {
        description: card.description,
        labels: card.labels,
        priority: card.priority,
        dueDate: card.dueDate,
        subtasks: card.subtasks,
        checklists: card.checklists,
        comments: card.comments,
        attachments: card.attachments,
        completed: card.completed,
        pinned: card.pinned,
        coverImageId: card.coverImageId
      })
    }
  }

  const handleDeleteConfirm = () => {
    if (!deleteConfirm) return
    if (deleteConfirm.type === 'card') deleteArchivedCard(deleteConfirm.id)
    else deleteArchivedColumn(deleteConfirm.id)
    setDeleteConfirm(null)
  }

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={() => { if (!useAppStore.getState().showOnboarding) setArchivePanelOpen(false) }} />
      <div data-tutorial="archive-panel" className="fixed right-0 top-0 bottom-0 w-80 z-50 bg-surface-secondary border-l border-border shadow-2xl animate-slide-in-right flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
          <h2 className="text-sm font-semibold text-content-primary">{t('archive.title')}</h2>
          <button
            onClick={() => { if (!useAppStore.getState().showOnboarding) setArchivePanelOpen(false) }}
            className="p-1 rounded text-content-tertiary hover:text-content-primary hover:bg-surface-tertiary transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border shrink-0">
          <button
            onClick={() => setTab('cards')}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors',
              tab === 'cards'
                ? 'text-accent border-b-2 border-accent'
                : 'text-content-tertiary hover:text-content-primary'
            )}
          >
            <CreditCard size={14} /> {t('archive.cards')} ({boardArchivedCards.length})
          </button>
          <button
            onClick={() => setTab('columns')}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors',
              tab === 'columns'
                ? 'text-accent border-b-2 border-accent'
                : 'text-content-tertiary hover:text-content-primary'
            )}
          >
            <Columns size={14} /> {t('archive.columns')} ({boardArchivedColumns.length})
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin">
          {tab === 'cards' && (
            boardArchivedCards.length === 0 ? (
              <EmptyState icon={CreditCard} title={t('archive.noCards')} className="py-8" />
            ) : (
              boardArchivedCards.map((card) => (
                <div key={card.id} className="p-3 rounded-lg bg-surface-tertiary border border-border">
                  <p className="text-sm font-medium text-content-primary mb-1">{card.title}</p>
                  <p className="text-xs text-content-tertiary mb-2">
                    {t('archive.from')} {card.originalColumnTitle} &middot; {formatTimestamp(card.archivedAt)}
                  </p>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => handleRestoreCard(card.id)}>
                      <RotateCcw size={12} /> {t('archive.restore')}
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => setDeleteConfirm({ type: 'card', id: card.id })}>
                      <Trash2 size={12} />
                    </Button>
                  </div>
                </div>
              ))
            )
          )}
          {tab === 'columns' && (
            boardArchivedColumns.length === 0 ? (
              <EmptyState icon={Columns} title={t('archive.noColumns')} className="py-8" />
            ) : (
              boardArchivedColumns.map((col) => (
                <div key={col.id} className="p-3 rounded-lg bg-surface-tertiary border border-border">
                  <p className="text-sm font-medium text-content-primary mb-1">{col.title}</p>
                  <p className="text-xs text-content-tertiary mb-2">
                    {col.cards.length} {t('column.cards')} &middot; {formatTimestamp(col.archivedAt)}
                  </p>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => handleRestoreColumn(col.id)}>
                      <RotateCcw size={12} /> {t('archive.restore')}
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => setDeleteConfirm({ type: 'column', id: col.id })}>
                      <Trash2 size={12} />
                    </Button>
                  </div>
                </div>
              ))
            )
          )}
        </div>
      </div>

      <ConfirmDialog
        open={deleteConfirm !== null}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDeleteConfirm}
        title={t('archive.deleteTitle')}
        message={t('archive.deleteMsg')}
        confirmLabel={t('archive.deleteForever')}
        danger
      />
    </>
  )
}
