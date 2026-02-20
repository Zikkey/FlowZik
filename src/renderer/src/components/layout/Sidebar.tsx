import { useState } from 'react'
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
  DragEndEvent, DragOverlay, DragStartEvent, useDroppable
} from '@dnd-kit/core'
import {
  SortableContext, verticalListSortingStrategy, useSortable, arrayMove
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  Plus, LayoutDashboard, Archive, ChevronLeft,
  MoreHorizontal, Pencil, Trash2, Settings, BookTemplate, GripVertical, StickyNote, Home,
  Copy, Download, Upload, Pin, FolderPlus, ChevronRight, Smile
} from 'lucide-react'
import { useAppStore, useBoardStore } from '@/store'
import { useToastStore } from '@/store/toast-store'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Dropdown, DropdownItem, DropdownSeparator } from '@/components/ui/Dropdown'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { ContextMenu, type ContextMenuItem } from '@/components/ui/ContextMenu'
import { BoardTemplates } from '@/components/board/BoardTemplates'
import { QuickNotes } from '@/components/notes/QuickNotes'
import { exportBoardToJSON, exportBoardToCSV, importFromJSON } from '@/lib/export'
import { useTranslation } from '@/hooks/use-translation'
import { BoardIcon, BoardIconPicker } from '@/components/ui/BoardIconPicker'
import { cn } from '@/lib/utils'

function SortableBoardItem({
  id, board, isActive, isEditing, editTitle, setEditTitle,
  onActivate, onRename, setEditingId, onMenuRename, onMenuDelete,
  onContextMenu, onIconChange
}: {
  id: string
  board: { title: string; icon?: string }
  isActive: boolean
  isEditing: boolean
  editTitle: string
  setEditTitle: (v: string) => void
  onActivate: () => void
  onRename: () => void
  setEditingId: (id: string | null) => void
  onMenuRename: () => void
  onMenuDelete: () => void
  onContextMenu: (e: React.MouseEvent) => void
  onIconChange: (icon: string | undefined) => void
}) {
  const { t } = useTranslation()
  const {
    attributes, listeners, setNodeRef, transform, transition, isDragging
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group flex items-center gap-0.5 rounded-lg transition-colors',
        isActive
          ? 'bg-accent/10 text-accent'
          : 'text-content-secondary hover:bg-surface-tertiary hover:text-content-primary'
      )}
      onContextMenu={onContextMenu}
      data-board-item
    >
      <div className="relative shrink-0 w-7 h-7 flex items-center justify-center">
        <span className="group-hover:opacity-0 transition-opacity">
          <BoardIcon name={board.icon} size={14} className={isActive ? 'text-accent' : 'text-content-tertiary'} />
        </span>
        <button
          {...attributes}
          {...listeners}
          className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 text-content-tertiary hover:text-content-primary cursor-grab active:cursor-grabbing"
        >
          <GripVertical size={12} />
        </button>
      </div>
      {isEditing ? (
        <input
          autoFocus
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onBlur={onRename}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onRename()
            if (e.key === 'Escape') setEditingId(null)
          }}
          className="flex-1 bg-transparent text-sm px-2 py-1.5 outline-none min-w-0"
        />
      ) : (
        <button
          onClick={onActivate}
          className="flex-1 text-left text-sm px-2 py-1.5 truncate min-w-0"
        >
          {board.title}
        </button>
      )}
      <Dropdown
        trigger={
          <button className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-surface-tertiary transition-all shrink-0">
            <MoreHorizontal size={14} />
          </button>
        }
        align="right"
      >
        <DropdownItem onClick={onMenuRename}>
          <Pencil size={14} /> {t('board.rename')}
        </DropdownItem>
        <DropdownSeparator />
        <DropdownItem danger onClick={onMenuDelete}>
          <Trash2 size={14} /> {t('board.delete')}
        </DropdownItem>
      </Dropdown>
    </div>
  )
}

function FolderDropZone({ folderId, isDragging, children }: { folderId: string; isDragging: boolean; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: `folder-drop:${folderId}` })
  return (
    <div
      ref={setNodeRef}
      className={cn(
        'mb-1 rounded-lg transition-colors',
        isDragging && 'border border-dashed border-transparent',
        isDragging && isOver && 'border-accent bg-accent/5'
      )}
    >
      {children}
    </div>
  )
}

function NoFolderDropZone({ isDragging, children }: { isDragging: boolean; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: 'no-folder-drop' })
  return (
    <div
      ref={setNodeRef}
      className={cn(
        'rounded-lg transition-colors min-h-[8px]',
        isDragging && 'border border-dashed border-transparent',
        isDragging && isOver && 'border-accent bg-accent/5'
      )}
    >
      {children}
    </div>
  )
}

export function Sidebar() {
  const sidebarOpen = useAppStore((s) => s.sidebarOpen)
  const toggleSidebar = useAppStore((s) => s.toggleSidebar)
  const addTitlebarPin = useAppStore((s) => s.addTitlebarPin)
  const titlebarPins = useAppStore((s) => s.titlebarPins)
  const activeBoardId = useAppStore((s) => s.activeBoardId)
  const setActiveBoardId = useAppStore((s) => s.setActiveBoardId)
  const setArchivePanelOpen = useAppStore((s) => s.setArchivePanelOpen)
  const setSettingsOpen = useAppStore((s) => s.setSettingsOpen)
  const showDashboard = useAppStore((s) => s.showDashboard)
  const setShowDashboard = useAppStore((s) => s.setShowDashboard)
  const boardFolders = useAppStore((s) => s.boardFolders)
  const createBoardFolder = useAppStore((s) => s.createBoardFolder)
  const renameBoardFolder = useAppStore((s) => s.renameBoardFolder)
  const deleteBoardFolder = useAppStore((s) => s.deleteBoardFolder)
  const toggleBoardFolder = useAppStore((s) => s.toggleBoardFolder)
  const { t } = useTranslation()
  const lang = t('sidebar.boards') === 'Доски' ? 'ru' : 'en'
  const addToast = useToastStore((s) => s.addToast)

  const boardOrder = useBoardStore((s) => s.boardOrder)
  const boards = useBoardStore((s) => s.boards)
  const createBoard = useBoardStore((s) => s.createBoard)
  const duplicateBoard = useBoardStore((s) => s.duplicateBoard)
  const updateBoard = useBoardStore((s) => s.updateBoard)
  const deleteBoard = useBoardStore((s) => s.deleteBoard)
  const reorderBoards = useBoardStore((s) => s.reorderBoards)

  const [creating, setCreating] = useState(false)
  const [newBoardTitle, setNewBoardTitle] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const notesOpen = useAppStore((s) => s.notesOpen)
  const setNotesOpen = useAppStore((s) => s.setNotesOpen)
  const [templatesOpen, setTemplatesOpen] = useState(false)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [boardCtxMenu, setBoardCtxMenu] = useState<{ x: number; y: number; boardId: string } | null>(null)
  const [sidebarCtxMenu, setSidebarCtxMenu] = useState<{ x: number; y: number } | null>(null)
  const [iconPickerBoardId, setIconPickerBoardId] = useState<string | null>(null)
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null)
  const [editFolderName, setEditFolderName] = useState('')
  const [creatingFolder, setCreatingFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [folderCtxMenu, setFolderCtxMenu] = useState<{ x: number; y: number; folderId: string } | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const handleCreate = () => {
    if (newBoardTitle.trim()) {
      const id = createBoard(newBoardTitle.trim())
      setActiveBoardId(id)
      setNewBoardTitle('')
      setCreating(false)
    }
  }

  const handleRename = (id: string) => {
    if (editTitle.trim()) {
      updateBoard(id, { title: editTitle.trim() })
    }
    setEditingId(null)
  }

  const handleDelete = (id: string) => {
    deleteBoard(id)
    if (activeBoardId === id) {
      const remaining = boardOrder.filter((bid) => bid !== id)
      setActiveBoardId(remaining[0] ?? null)
    }
    setDeleteConfirm(null)
  }

  const handleDragStart = (event: DragStartEvent) => {
    setDraggingId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const draggedId = draggingId
    setDraggingId(null)
    const { active, over } = event
    if (!over) return

    const overId = over.id as string

    // Check if dropped on a folder drop zone
    if (overId.startsWith('folder-drop:') && draggedId) {
      const folderId = overId.replace('folder-drop:', '')
      updateBoard(draggedId, { folderId })
      return
    }

    // Check if dropped on "no folder" zone
    if (overId === 'no-folder-drop' && draggedId) {
      updateBoard(draggedId, { folderId: undefined })
      return
    }

    if (active.id === over.id) return
    const oldIndex = boardOrder.indexOf(active.id as string)
    const newIndex = boardOrder.indexOf(overId)
    if (oldIndex !== -1 && newIndex !== -1) {
      // If dropping onto a board that's in a folder, move into that folder too
      const targetBoard = boards[overId]
      if (targetBoard?.folderId && draggedId) {
        updateBoard(draggedId, { folderId: targetBoard.folderId })
      }
      reorderBoards(arrayMove(boardOrder, oldIndex, newIndex))
    }
  }

  const handleBoardContextMenu = (e: React.MouseEvent, boardId: string) => {
    e.preventDefault()
    e.stopPropagation()
    setBoardCtxMenu({ x: e.clientX, y: e.clientY, boardId })
  }

  const handleSidebarContextMenu = (e: React.MouseEvent) => {
    // Only trigger if clicking directly on the list area, not on a board item
    if ((e.target as HTMLElement).closest('[data-board-item]')) return
    e.preventDefault()
    setSidebarCtxMenu({ x: e.clientX, y: e.clientY })
  }

  const getBoardCtxMenuItems = (boardId: string): ContextMenuItem[] => {
    const board = boards[boardId]
    if (!board) return []
    return [
      { id: 'rename', label: lang === 'ru' ? 'Переименовать' : 'Rename', icon: <Pencil size={14} />, onClick: () => { setEditingId(boardId); setEditTitle(board.title) } },
      { id: 'icon', label: lang === 'ru' ? 'Сменить иконку' : 'Change icon', icon: <Smile size={14} />, onClick: () => setIconPickerBoardId(boardId) },
      { id: 'duplicate', label: lang === 'ru' ? 'Дублировать' : 'Duplicate', icon: <Copy size={14} />, onClick: () => {
        const newId = duplicateBoard(boardId)
        if (newId) { setActiveBoardId(newId); setShowDashboard(false) }
      }},
      { id: 'sep-1', label: '', separator: true },
      { id: 'export-json', label: lang === 'ru' ? 'Экспорт JSON' : 'Export JSON', icon: <Download size={14} />, onClick: async () => {
        try {
          const path = await window.electronAPI.saveFileDialog(`${board.title}.json`)
          if (path) await window.electronAPI.writeFile(path, exportBoardToJSON(boardId))
        } catch { addToast(lang === 'ru' ? 'Ошибка экспорта' : 'Export failed', 'error') }
      }},
      { id: 'export-csv', label: lang === 'ru' ? 'Экспорт CSV' : 'Export CSV', icon: <Download size={14} />, onClick: async () => {
        try {
          const path = await window.electronAPI.saveFileDialog(`${board.title}.csv`)
          if (path) await window.electronAPI.writeFile(path, exportBoardToCSV(boardId))
        } catch { addToast(lang === 'ru' ? 'Ошибка экспорта' : 'Export failed', 'error') }
      }},
      { id: 'pin', label: lang === 'ru' ? 'Закрепить в titlebar' : 'Pin to titlebar', icon: <Pin size={14} />,
        disabled: titlebarPins.some((p) => p.type === 'board' && p.targetId === boardId),
        onClick: () => addTitlebarPin({ type: 'board', targetId: boardId, label: board.title })
      },
      ...(boardFolders.length > 0 ? [{
        id: 'move-folder',
        label: lang === 'ru' ? 'Переместить в папку' : 'Move to folder',
        icon: <FolderPlus size={14} />,
        submenu: [
          ...(board.folderId ? [{
            id: 'folder-none',
            label: lang === 'ru' ? 'Без папки' : 'No folder',
            onClick: () => updateBoard(boardId, { folderId: undefined })
          }] : []),
          ...boardFolders.map((f) => ({
            id: `folder-${f.id}`,
            label: f.name,
            disabled: board.folderId === f.id,
            onClick: () => updateBoard(boardId, { folderId: f.id })
          }))
        ]
      }] : []),
      { id: 'sep-2', label: '', separator: true },
      { id: 'delete', label: lang === 'ru' ? 'Удалить' : 'Delete', icon: <Trash2 size={14} />, danger: true, onClick: () => setDeleteConfirm(boardId) },
    ]
  }

  const sidebarCtxMenuItems: ContextMenuItem[] = [
    { id: 'new-board', label: lang === 'ru' ? 'Новая доска' : 'New board', icon: <Plus size={14} />, onClick: () => setCreating(true) },
    { id: 'new-folder', label: lang === 'ru' ? 'Новая папка' : 'New folder', icon: <FolderPlus size={14} />, onClick: () => setCreatingFolder(true) },
    { id: 'import', label: lang === 'ru' ? 'Импорт JSON' : 'Import JSON', icon: <Upload size={14} />, onClick: async () => {
      try {
        const path = await window.electronAPI.openFileDialog()
        if (path) {
          const content = await window.electronAPI.readFile(path)
          importFromJSON(content)
          addToast(lang === 'ru' ? 'Данные импортированы' : 'Data imported', 'success')
        }
      } catch {
        addToast(lang === 'ru' ? 'Ошибка импорта: неверный формат' : 'Import error: invalid format', 'error')
      }
    }},
    { id: 'sep', label: '', separator: true },
    { id: 'collapse', label: lang === 'ru' ? 'Свернуть панель' : 'Collapse sidebar', icon: <ChevronLeft size={14} />, onClick: toggleSidebar },
  ]

  return (
    <>
      <aside
        data-tutorial="sidebar"
        className={cn(
          'h-full bg-surface-secondary border-r border-border flex flex-col transition-all duration-200 shrink-0 overflow-hidden',
          sidebarOpen ? 'w-60' : 'w-0'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-3 border-b border-border">
          <div className="flex items-center gap-2 text-content-primary">
            <LayoutDashboard size={16} className="text-accent" />
            <span className="text-sm font-semibold">{t('sidebar.boards')}</span>
          </div>
          <button
            onClick={toggleSidebar}
            className="p-1 rounded text-content-tertiary hover:text-content-primary hover:bg-surface-tertiary transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
        </div>

        {/* Dashboard */}
        <div className="px-2 pt-2">
          <button
            onClick={() => { setShowDashboard(true); setActiveBoardId(null) }}
            className={cn(
              'w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors',
              showDashboard
                ? 'bg-accent/10 text-accent font-medium'
                : 'text-content-secondary hover:bg-surface-tertiary hover:text-content-primary'
            )}
          >
            <Home size={14} />
            {lang === 'ru' ? 'Обзор' : 'Dashboard'}
          </button>
        </div>

        {/* Board list */}
        <div className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5 scrollbar-thin" onContextMenu={handleSidebarContextMenu}>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={boardOrder} strategy={verticalListSortingStrategy}>
              {/* Folders */}
              {boardFolders.map((folder) => {
                const folderBoards = boardOrder.filter((id) => boards[id]?.folderId === folder.id)
                return (
                  <FolderDropZone key={folder.id} folderId={folder.id} isDragging={!!draggingId}>
                    <div
                      className="group flex items-center gap-1 px-1 py-1 rounded-md text-content-tertiary hover:bg-surface-tertiary transition-colors cursor-pointer"
                      onClick={() => toggleBoardFolder(folder.id)}
                      onContextMenu={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setFolderCtxMenu({ x: e.clientX, y: e.clientY, folderId: folder.id })
                      }}
                    >
                      <ChevronRight size={12} className={cn('transition-transform', !folder.collapsed && 'rotate-90')} />
                      {editingFolderId === folder.id ? (
                        <input
                          autoFocus
                          value={editFolderName}
                          onChange={(e) => setEditFolderName(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          onBlur={() => {
                            if (editFolderName.trim()) renameBoardFolder(folder.id, editFolderName.trim())
                            setEditingFolderId(null)
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') { if (editFolderName.trim()) renameBoardFolder(folder.id, editFolderName.trim()); setEditingFolderId(null) }
                            if (e.key === 'Escape') setEditingFolderId(null)
                          }}
                          className="flex-1 bg-transparent text-xs px-1 outline-none text-content-primary min-w-0"
                        />
                      ) : (
                        <span className="flex-1 text-xs font-medium truncate">{folder.name}</span>
                      )}
                      <span className="text-[10px] opacity-0 group-hover:opacity-100">{folderBoards.length}</span>
                    </div>
                    {!folder.collapsed && (
                      <div className="pl-3 space-y-0.5">
                        {folderBoards.map((id) => {
                          const board = boards[id]
                          if (!board) return null
                          return (
                            <SortableBoardItem
                              key={id}
                              id={id}
                              board={board}
                              isActive={id === activeBoardId}
                              isEditing={id === editingId}
                              editTitle={editTitle}
                              setEditTitle={setEditTitle}
                              onActivate={() => { setActiveBoardId(id); setShowDashboard(false) }}
                              onRename={() => handleRename(id)}
                              setEditingId={setEditingId}
                              onMenuRename={() => { setEditingId(id); setEditTitle(board.title) }}
                              onMenuDelete={() => setDeleteConfirm(id)}
                              onContextMenu={(e) => handleBoardContextMenu(e, id)}
                              onIconChange={(icon) => updateBoard(id, { icon })}
                            />
                          )
                        })}
                      </div>
                    )}
                  </FolderDropZone>
                )
              })}

              {/* Root boards (no folder) — droppable zone to remove from folder */}
              <NoFolderDropZone isDragging={!!draggingId}>
                {boardOrder.map((id) => {
                  const board = boards[id]
                  if (!board || board.folderId) return null
                  return (
                    <SortableBoardItem
                      key={id}
                      id={id}
                      board={board}
                      isActive={id === activeBoardId}
                      isEditing={id === editingId}
                      editTitle={editTitle}
                      setEditTitle={setEditTitle}
                      onActivate={() => { setActiveBoardId(id); setShowDashboard(false) }}
                      onRename={() => handleRename(id)}
                      setEditingId={setEditingId}
                      onMenuRename={() => { setEditingId(id); setEditTitle(board.title) }}
                      onMenuDelete={() => setDeleteConfirm(id)}
                      onContextMenu={(e) => handleBoardContextMenu(e, id)}
                      onIconChange={(icon) => updateBoard(id, { icon })}
                    />
                  )
                })}
              </NoFolderDropZone>
            </SortableContext>
            <DragOverlay>
              {draggingId && boards[draggingId] && (
                <div className="flex items-center gap-1 rounded-lg bg-surface-elevated border border-accent/50 shadow-lg px-3 py-1.5 text-sm text-content-primary">
                  {boards[draggingId].title}
                </div>
              )}
            </DragOverlay>
          </DndContext>

          {/* Create new folder */}
          {creatingFolder && (
            <div className="px-1 py-1">
              <Input
                autoFocus
                placeholder={lang === 'ru' ? 'Имя папки...' : 'Folder name...'}
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newFolderName.trim()) { createBoardFolder(newFolderName.trim()); setNewFolderName(''); setCreatingFolder(false) }
                  if (e.key === 'Escape') { setCreatingFolder(false); setNewFolderName('') }
                }}
                onBlur={() => {
                  if (newFolderName.trim()) createBoardFolder(newFolderName.trim())
                  setCreatingFolder(false); setNewFolderName('')
                }}
              />
            </div>
          )}

          {/* Create new board */}
          {creating ? (
            <div className="px-1 py-1">
              <Input
                autoFocus
                placeholder={lang === 'ru' ? 'Название доски...' : 'Board name...'}
                value={newBoardTitle}
                onChange={(e) => setNewBoardTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreate()
                  if (e.key === 'Escape') { setCreating(false); setNewBoardTitle('') }
                }}
                onBlur={() => {
                  if (newBoardTitle.trim()) handleCreate()
                  else { setCreating(false); setNewBoardTitle('') }
                }}
              />
            </div>
          ) : (
            <div className="flex items-center gap-1" data-tutorial="new-board">
              <button
                onClick={() => setCreating(true)}
                className="flex-1 flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-content-tertiary hover:bg-surface-tertiary hover:text-content-primary transition-colors"
              >
                <Plus size={14} /> {t('sidebar.newBoard')}
              </button>
              <button
                onClick={() => setTemplatesOpen(true)}
                className="p-1.5 rounded-lg text-content-tertiary hover:bg-surface-tertiary hover:text-content-primary transition-colors"
                title={lang === 'ru' ? 'Шаблоны' : 'Templates'}
              >
                <BookTemplate size={14} />
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border p-2 space-y-1" data-tutorial="sidebar-footer">
          <button
            data-tutorial="notes-btn"
            onClick={() => setNotesOpen(true)}
            className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-content-secondary hover:bg-surface-tertiary hover:text-content-primary transition-colors"
          >
            <StickyNote size={14} /> {lang === 'ru' ? 'Заметки' : 'Notes'}
          </button>
          <button
            data-tutorial="archive-btn"
            onClick={() => setArchivePanelOpen(true)}
            className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-content-secondary hover:bg-surface-tertiary hover:text-content-primary transition-colors"
          >
            <Archive size={14} /> {t('sidebar.archive')}
          </button>
          <button
            data-tutorial="settings-btn"
            onClick={() => setSettingsOpen(true)}
            className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-content-secondary hover:bg-surface-tertiary hover:text-content-primary transition-colors"
          >
            <Settings size={14} /> {t('sidebar.settings' as any)}
          </button>
        </div>
      </aside>

      <ConfirmDialog
        open={deleteConfirm !== null}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
        title={t('board.deleteTitle')}
        message={t('board.deleteMsg')}
        confirmLabel={t('common.delete')}
        danger
      />
      <BoardTemplates open={templatesOpen} onClose={() => setTemplatesOpen(false)} />
      <QuickNotes open={notesOpen} onClose={() => setNotesOpen(false)} />
      {boardCtxMenu && (
        <ContextMenu
          x={boardCtxMenu.x} y={boardCtxMenu.y}
          items={getBoardCtxMenuItems(boardCtxMenu.boardId)}
          onClose={() => setBoardCtxMenu(null)}
        />
      )}
      {sidebarCtxMenu && (
        <ContextMenu
          x={sidebarCtxMenu.x} y={sidebarCtxMenu.y}
          items={sidebarCtxMenuItems}
          onClose={() => setSidebarCtxMenu(null)}
        />
      )}
      {folderCtxMenu && (
        <ContextMenu
          x={folderCtxMenu.x} y={folderCtxMenu.y}
          items={[
            { id: 'rename-folder', label: lang === 'ru' ? 'Переименовать' : 'Rename', icon: <Pencil size={14} />, onClick: () => {
              const folder = boardFolders.find((f) => f.id === folderCtxMenu.folderId)
              if (folder) { setEditingFolderId(folder.id); setEditFolderName(folder.name) }
            }},
            { id: 'sep', label: '', separator: true },
            { id: 'delete-folder', label: lang === 'ru' ? 'Удалить папку' : 'Delete folder', icon: <Trash2 size={14} />, danger: true, onClick: () => {
              // Move all boards out of folder first
              boardOrder.forEach((id) => {
                if (boards[id]?.folderId === folderCtxMenu.folderId) updateBoard(id, { folderId: undefined })
              })
              deleteBoardFolder(folderCtxMenu.folderId)
            }}
          ]}
          onClose={() => setFolderCtxMenu(null)}
        />
      )}
      {/* Icon picker modal */}
      {iconPickerBoardId && (() => {
        const BOARD_ICONS = [
          'layout-dashboard', 'kanban', 'list-todo', 'clipboard-list', 'target',
          'rocket', 'zap', 'flame', 'star', 'heart',
          'trophy', 'medal', 'crown', 'gem', 'sparkles',
          'code-2', 'terminal', 'bug', 'cpu', 'database',
          'globe', 'compass', 'map', 'navigation', 'send',
          'briefcase', 'building-2', 'calendar', 'clock', 'timer',
          'users', 'user-check', 'graduation-cap', 'book-open', 'bookmark',
          'music', 'palette', 'camera', 'film', 'gamepad-2',
          'shopping-cart', 'package', 'truck', 'plane', 'anchor',
          'shield-check', 'lock', 'key', 'settings', 'wrench',
          'lightbulb', 'megaphone', 'bell', 'flag', 'tag',
          'folder', 'file-text', 'inbox', 'mail', 'message-circle',
          'home', 'mountain', 'sun', 'moon', 'cloud',
          'tree-pine', 'flower-2', 'paw-print', 'fish', 'bird',
          'pizza', 'coffee', 'wine', 'apple', 'cherry'
        ]
        const currentIcon = boards[iconPickerBoardId]?.icon
        return (
          <div className="fixed inset-0 z-[100] flex items-center justify-center" onClick={() => setIconPickerBoardId(null)}>
            <div className="fixed inset-0 bg-black/30" />
            <div className="relative bg-surface-elevated border border-border rounded-xl shadow-2xl p-4 w-[300px] animate-scale-in" onClick={(e) => e.stopPropagation()}>
              <p className="text-sm font-medium text-content-primary mb-3">{lang === 'ru' ? 'Выберите иконку' : 'Choose icon'}</p>
              {currentIcon && (
                <button
                  onClick={() => { updateBoard(iconPickerBoardId, { icon: undefined }); setIconPickerBoardId(null) }}
                  className="w-full text-xs text-content-tertiary hover:text-content-primary px-2 py-1 mb-2 rounded hover:bg-surface-tertiary text-left"
                >
                  {lang === 'ru' ? 'Убрать иконку' : 'Remove icon'}
                </button>
              )}
              <div className="grid grid-cols-10 gap-0.5 max-h-[220px] overflow-y-auto scrollbar-thin">
                {BOARD_ICONS.map((name) => (
                  <button
                    key={name}
                    onClick={() => { updateBoard(iconPickerBoardId, { icon: name }); setIconPickerBoardId(null) }}
                    className={cn(
                      'flex items-center justify-center w-7 h-7 rounded-md transition-colors',
                      currentIcon === name
                        ? 'bg-accent/15 text-accent'
                        : 'text-content-secondary hover:bg-surface-tertiary hover:text-content-primary'
                    )}
                    title={name}
                  >
                    <BoardIcon name={name} size={15} />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )
      })()}
    </>
  )
}
