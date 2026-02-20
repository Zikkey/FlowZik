import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { temporal } from 'zundo'
import { electronStoreStorage } from './storage-adapter'
import { createId } from '@/lib/id'
import { DEFAULT_LABELS } from '@/lib/constants'
import type { Board, Column, Card, Label, Priority, Subtask, Checklist, Comment, Attachment } from '@/types'

interface BoardState {
  boards: Record<string, Board>
  columns: Record<string, Column>
  cards: Record<string, Card>
  boardOrder: string[]
  globalLabels: Label[]

  createBoard: (title: string) => string
  duplicateBoard: (boardId: string) => string | null
  updateBoard: (id: string, updates: Partial<Pick<Board, 'title' | 'icon' | 'folderId'>>) => void
  deleteBoard: (id: string) => void

  createColumn: (boardId: string, title: string) => string
  updateColumn: (id: string, updates: Partial<Pick<Column, 'title' | 'color' | 'showProgress'>>) => void
  deleteColumn: (id: string) => { column: Column; cards: Card[] }
  reorderColumns: (boardId: string, columnOrder: string[]) => void

  createCard: (columnId: string, title: string) => string
  updateCard: (id: string, updates: Partial<Pick<Card, 'title' | 'description' | 'priority' | 'dueDate' | 'labels' | 'completed' | 'pinned' | 'coverImageId' | 'subtasks' | 'checklists' | 'comments' | 'attachments'>>) => void
  deleteCard: (id: string) => Card | null
  moveCard: (cardId: string, fromColumnId: string, toColumnId: string, newIndex: number) => void
  moveCardsToColumn: (cardIds: string[], toColumnId: string, anchorCardId: string) => void
  reorderCardsInColumn: (columnId: string, cardIds: string[]) => void

  addSubtask: (cardId: string, title: string) => void
  toggleSubtask: (cardId: string, subtaskId: string) => void
  updateSubtask: (cardId: string, subtaskId: string, title: string) => void
  deleteSubtask: (cardId: string, subtaskId: string) => void

  addChecklist: (cardId: string, title: string) => void
  renameChecklist: (cardId: string, checklistId: string, title: string) => void
  deleteChecklist: (cardId: string, checklistId: string) => void
  addChecklistItem: (cardId: string, checklistId: string, title: string) => void
  toggleChecklistItem: (cardId: string, checklistId: string, itemId: string) => void
  updateChecklistItem: (cardId: string, checklistId: string, itemId: string, title: string) => void
  deleteChecklistItem: (cardId: string, checklistId: string, itemId: string) => void

  addComment: (cardId: string, text: string) => void
  updateComment: (cardId: string, commentId: string, text: string) => void
  deleteComment: (cardId: string, commentId: string) => void

  addLabelToCard: (cardId: string, label: Label) => void
  removeLabelFromCard: (cardId: string, labelId: string) => void
  addAttachment: (cardId: string, data: Omit<Attachment, 'id' | 'createdAt'>) => void
  removeAttachment: (cardId: string, attachmentId: string) => void

  reorderBoards: (boardOrder: string[]) => void
  duplicateCard: (cardId: string) => string | null
  pasteCardsToColumn: (cardIds: string[], targetColumnId: string) => string[]
  sortColumnCards: (columnId: string, sortBy: 'priority' | 'dueDate' | 'title' | 'created') => void
  bulkSetPriority: (cardIds: string[], priority: Priority) => void
  bulkAddLabel: (cardIds: string[], label: Label) => void
  bulkMoveToColumn: (cardIds: string[], columnId: string) => void
  bulkDelete: (cardIds: string[]) => void
  bulkSetCompleted: (cardIds: string[], completed: boolean) => void

  createLabel: (name: string, color: string, emoji?: string) => string
  updateLabel: (id: string, updates: Partial<Pick<Label, 'name' | 'color' | 'emoji'>>) => void
  deleteLabel: (id: string) => void
}

export const useBoardStore = create<BoardState>()(
  temporal(
  persist(
    (set, get) => ({
      boards: {},
      columns: {},
      cards: {},
      boardOrder: [],
      globalLabels: [...DEFAULT_LABELS],

      createBoard: (title) => {
        const id = createId()
        const now = new Date().toISOString()
        set((state) => ({
          boards: {
            ...state.boards,
            [id]: { id, title, columnOrder: [], createdAt: now, updatedAt: now }
          },
          boardOrder: [...state.boardOrder, id]
        }))
        return id
      },

      duplicateBoard: (boardId) => {
        const state = get()
        const board = state.boards[boardId]
        if (!board) return null
        const now = new Date().toISOString()
        const newBoardId = createId()
        const newColumns: Record<string, Column> = {}
        const newCards: Record<string, Card> = {}
        const newColumnOrder: string[] = []

        for (const colId of board.columnOrder) {
          const col = state.columns[colId]
          if (!col) continue
          const newColId = createId()
          const newCardIds: string[] = []
          for (const cardId of col.cardIds) {
            const card = state.cards[cardId]
            if (!card) continue
            const newCardId = createId()
            newCards[newCardId] = {
              ...card,
              id: newCardId,
              columnId: newColId,
              boardId: newBoardId,
              subtasks: card.subtasks.map((s) => ({ ...s, id: createId() })),
              checklists: (card.checklists ?? []).map((cl) => ({
                ...cl, id: createId(),
                items: cl.items.map((i) => ({ ...i, id: createId() }))
              })),
              comments: [],
              attachments: [...(card.attachments ?? [])],
              createdAt: now,
              updatedAt: now,
            }
            newCardIds.push(newCardId)
          }
          newColumns[newColId] = { id: newColId, boardId: newBoardId, title: col.title, color: col.color, showProgress: col.showProgress, cardIds: newCardIds, createdAt: now, updatedAt: now }
          newColumnOrder.push(newColId)
        }

        set((s) => ({
          boards: { ...s.boards, [newBoardId]: { id: newBoardId, title: `${board.title} (copy)`, icon: board.icon, folderId: board.folderId, columnOrder: newColumnOrder, createdAt: now, updatedAt: now } },
          columns: { ...s.columns, ...newColumns },
          cards: { ...s.cards, ...newCards },
          boardOrder: [...s.boardOrder, newBoardId]
        }))
        return newBoardId
      },

      updateBoard: (id, updates) => {
        set((state) => {
          const board = state.boards[id]
          if (!board) return state
          return {
            boards: {
              ...state.boards,
              [id]: { ...board, ...updates, updatedAt: new Date().toISOString() }
            }
          }
        })
      },

      deleteBoard: (id) => {
        set((state) => {
          const board = state.boards[id]
          if (!board) return state
          const newColumns = { ...state.columns }
          const newCards = { ...state.cards }
          for (const colId of board.columnOrder) {
            const col = newColumns[colId]
            if (col) {
              for (const cardId of col.cardIds) delete newCards[cardId]
              delete newColumns[colId]
            }
          }
          const newBoards = { ...state.boards }
          delete newBoards[id]
          return {
            boards: newBoards,
            columns: newColumns,
            cards: newCards,
            boardOrder: state.boardOrder.filter((bid) => bid !== id)
          }
        })
      },

      createColumn: (boardId, title) => {
        const id = createId()
        const now = new Date().toISOString()
        const board = get().boards[boardId]
        if (!board) return id
        set((state) => {
          const b = state.boards[boardId]
          if (!b) return state
          return {
            columns: {
              ...state.columns,
              [id]: { id, boardId, title, cardIds: [], createdAt: now, updatedAt: now }
            },
            boards: {
              ...state.boards,
              [boardId]: {
                ...b,
                columnOrder: [...b.columnOrder, id],
                updatedAt: now
              }
            }
          }
        })
        return id
      },

      updateColumn: (id, updates) => {
        set((state) => {
          const col = state.columns[id]
          if (!col) return state
          return {
            columns: {
              ...state.columns,
              [id]: { ...col, ...updates, updatedAt: new Date().toISOString() }
            }
          }
        })
      },

      deleteColumn: (id) => {
        const state = get()
        const column = state.columns[id]
        const deletedCards = column ? column.cardIds.map((cid) => state.cards[cid]).filter(Boolean) : []

        set((s) => {
          const col = s.columns[id]
          if (!col) return s
          const board = s.boards[col.boardId]
          const newCards = { ...s.cards }
          for (const cardId of col.cardIds) delete newCards[cardId]
          const newColumns = { ...s.columns }
          delete newColumns[id]
          return {
            columns: newColumns,
            cards: newCards,
            boards: {
              ...s.boards,
              ...(board ? {
                [col.boardId]: {
                  ...board,
                  columnOrder: board.columnOrder.filter((cid) => cid !== id),
                  updatedAt: new Date().toISOString()
                }
              } : {})
            }
          }
        })
        return { column, cards: deletedCards }
      },

      reorderColumns: (boardId, columnOrder) => {
        set((state) => {
          const board = state.boards[boardId]
          if (!board) return state
          return {
            boards: {
              ...state.boards,
              [boardId]: { ...board, columnOrder, updatedAt: new Date().toISOString() }
            }
          }
        })
      },

      createCard: (columnId, title) => {
        const id = createId()
        const now = new Date().toISOString()
        const col = get().columns[columnId]
        if (!col) return id
        set((state) => {
          const column = state.columns[columnId]
          if (!column) return state
          return {
            cards: {
              ...state.cards,
              [id]: {
                id,
                columnId,
                boardId: col.boardId,
                title,
                description: '',
                labels: [],
                priority: 'none' as Priority,
                dueDate: null,
                subtasks: [],
                comments: [],
                attachments: [],
                completed: false,
                createdAt: now,
                updatedAt: now
              }
            },
            columns: {
              ...state.columns,
              [columnId]: {
                ...column,
                cardIds: [...column.cardIds, id],
                updatedAt: now
              }
            }
          }
        })
        return id
      },

      updateCard: (id, updates) => {
        set((state) => {
          const card = state.cards[id]
          if (!card) return state
          const merged = { ...card, ...updates, updatedAt: new Date().toISOString() }
          // Auto-complete all subtasks when card is marked as completed
          if (updates.completed === true && merged.subtasks?.length) {
            merged.subtasks = merged.subtasks.map((s: any) => ({ ...s, completed: true }))
          }
          return { cards: { ...state.cards, [id]: merged } }
        })
      },

      deleteCard: (id) => {
        const card = get().cards[id]
        if (!card) return null
        set((s) => {
          const currentCard = s.cards[id]
          if (!currentCard) return s
          const newCards = { ...s.cards }
          delete newCards[id]
          const col = s.columns[currentCard.columnId]
          return {
            cards: newCards,
            columns: {
              ...s.columns,
              ...(col ? {
                [currentCard.columnId]: {
                  ...col,
                  cardIds: col.cardIds.filter((cid) => cid !== id),
                  updatedAt: new Date().toISOString()
                }
              } : {})
            }
          }
        })
        return card
      },

      moveCard: (cardId, fromColumnId, toColumnId, newIndex) => {
        set((state) => {
          const fromCol = state.columns[fromColumnId]
          const toCol = state.columns[toColumnId]
          const card = state.cards[cardId]
          if (!fromCol || !toCol || !card) return state
          const fromCardIds = fromCol.cardIds.filter((id) => id !== cardId)
          let toCardIds: string[]
          if (fromColumnId === toColumnId) {
            toCardIds = fromCardIds
          } else {
            toCardIds = [...toCol.cardIds.filter((id) => id !== cardId)]
          }
          const clampedIndex = Math.max(0, Math.min(newIndex, toCardIds.length))
          toCardIds.splice(clampedIndex, 0, cardId)

          const now = new Date().toISOString()
          return {
            cards: {
              ...state.cards,
              [cardId]: { ...state.cards[cardId], columnId: toColumnId, updatedAt: now }
            },
            columns: {
              ...state.columns,
              [fromColumnId]: {
                ...state.columns[fromColumnId],
                cardIds: fromColumnId === toColumnId ? toCardIds : fromCardIds,
                updatedAt: now
              },
              ...(fromColumnId !== toColumnId
                ? { [toColumnId]: { ...state.columns[toColumnId], cardIds: toCardIds, updatedAt: now } }
                : {})
            }
          }
        })
      },

      moveCardsToColumn: (cardIds, toColumnId, anchorCardId) => {
        set((state) => {
          const now = new Date().toISOString()
          const newCards = { ...state.cards }
          const newColumns = { ...state.columns }
          const cardIdSet = new Set(cardIds)

          // Collect source columns and update card columnIds
          const sourceColumns = new Set<string>()
          for (const cid of cardIds) {
            const card = state.cards[cid]
            if (!card) continue
            sourceColumns.add(card.columnId)
            newCards[cid] = { ...card, columnId: toColumnId, updatedAt: now }
          }

          // Remove cards from all source columns
          for (const colId of Array.from(sourceColumns)) {
            newColumns[colId] = {
              ...newColumns[colId] ?? state.columns[colId],
              cardIds: (newColumns[colId] ?? state.columns[colId]).cardIds.filter((id) => !cardIdSet.has(id)),
              updatedAt: now
            }
          }

          // Insert into target column after anchor card
          const targetCol = newColumns[toColumnId] ?? state.columns[toColumnId]
          if (!targetCol) return state
          const targetIds = targetCol.cardIds.filter((id) => !cardIdSet.has(id))
          const anchorIndex = targetIds.indexOf(anchorCardId)
          const insertAt = anchorIndex === -1 ? targetIds.length : anchorIndex + 1
          const finalIds = [
            ...targetIds.slice(0, insertAt),
            ...cardIds,
            ...targetIds.slice(insertAt)
          ]
          newColumns[toColumnId] = { ...targetCol, cardIds: finalIds, updatedAt: now }

          return { cards: newCards, columns: newColumns }
        })
      },

      reorderCardsInColumn: (columnId, cardIds) => {
        set((state) => {
          const col = state.columns[columnId]
          if (!col) return state
          return { columns: { ...state.columns, [columnId]: { ...col, cardIds, updatedAt: new Date().toISOString() } } }
        })
      },

      addSubtask: (cardId, title) => {
        const subtask: Subtask = { id: createId(), title, completed: false, createdAt: new Date().toISOString() }
        set((state) => {
          const card = state.cards[cardId]
          if (!card) return state
          return { cards: { ...state.cards, [cardId]: { ...card, subtasks: [...card.subtasks, subtask], updatedAt: new Date().toISOString() } } }
        })
      },

      toggleSubtask: (cardId, subtaskId) => {
        set((state) => {
          const card = state.cards[cardId]
          if (!card) return state
          return { cards: { ...state.cards, [cardId]: { ...card, subtasks: card.subtasks.map((s) => s.id === subtaskId ? { ...s, completed: !s.completed } : s), updatedAt: new Date().toISOString() } } }
        })
      },

      updateSubtask: (cardId, subtaskId, title) => {
        set((state) => {
          const card = state.cards[cardId]
          if (!card) return state
          return { cards: { ...state.cards, [cardId]: { ...card, subtasks: card.subtasks.map((s) => s.id === subtaskId ? { ...s, title } : s), updatedAt: new Date().toISOString() } } }
        })
      },

      deleteSubtask: (cardId, subtaskId) => {
        set((state) => {
          const card = state.cards[cardId]
          if (!card) return state
          return { cards: { ...state.cards, [cardId]: { ...card, subtasks: card.subtasks.filter((s) => s.id !== subtaskId), updatedAt: new Date().toISOString() } } }
        })
      },

      addChecklist: (cardId, title) => {
        const checklist: Checklist = { id: createId(), title, items: [] }
        set((state) => {
          const card = state.cards[cardId]
          if (!card) return state
          return { cards: { ...state.cards, [cardId]: { ...card, checklists: [...(card.checklists ?? []), checklist], updatedAt: new Date().toISOString() } } }
        })
      },

      renameChecklist: (cardId, checklistId, title) => {
        set((state) => {
          const card = state.cards[cardId]
          if (!card) return state
          return { cards: { ...state.cards, [cardId]: { ...card, checklists: (card.checklists ?? []).map((cl) => cl.id === checklistId ? { ...cl, title } : cl), updatedAt: new Date().toISOString() } } }
        })
      },

      deleteChecklist: (cardId, checklistId) => {
        set((state) => {
          const card = state.cards[cardId]
          if (!card) return state
          return { cards: { ...state.cards, [cardId]: { ...card, checklists: (card.checklists ?? []).filter((cl) => cl.id !== checklistId), updatedAt: new Date().toISOString() } } }
        })
      },

      addChecklistItem: (cardId, checklistId, title) => {
        const item: Subtask = { id: createId(), title, completed: false, createdAt: new Date().toISOString() }
        set((state) => {
          const card = state.cards[cardId]
          if (!card) return state
          return { cards: { ...state.cards, [cardId]: { ...card, checklists: (card.checklists ?? []).map((cl) => cl.id === checklistId ? { ...cl, items: [...cl.items, item] } : cl), updatedAt: new Date().toISOString() } } }
        })
      },

      toggleChecklistItem: (cardId, checklistId, itemId) => {
        set((state) => {
          const card = state.cards[cardId]
          if (!card) return state
          return { cards: { ...state.cards, [cardId]: { ...card, checklists: (card.checklists ?? []).map((cl) => cl.id === checklistId ? { ...cl, items: cl.items.map((i) => i.id === itemId ? { ...i, completed: !i.completed } : i) } : cl), updatedAt: new Date().toISOString() } } }
        })
      },

      updateChecklistItem: (cardId, checklistId, itemId, title) => {
        set((state) => {
          const card = state.cards[cardId]
          if (!card) return state
          return { cards: { ...state.cards, [cardId]: { ...card, checklists: (card.checklists ?? []).map((cl) => cl.id === checklistId ? { ...cl, items: cl.items.map((i) => i.id === itemId ? { ...i, title } : i) } : cl), updatedAt: new Date().toISOString() } } }
        })
      },

      deleteChecklistItem: (cardId, checklistId, itemId) => {
        set((state) => {
          const card = state.cards[cardId]
          if (!card) return state
          return { cards: { ...state.cards, [cardId]: { ...card, checklists: (card.checklists ?? []).map((cl) => cl.id === checklistId ? { ...cl, items: cl.items.filter((i) => i.id !== itemId) } : cl), updatedAt: new Date().toISOString() } } }
        })
      },

      addComment: (cardId, text) => {
        const now = new Date().toISOString()
        const comment: Comment = { id: createId(), text, createdAt: now, updatedAt: now }
        set((state) => {
          const card = state.cards[cardId]
          if (!card) return state
          return { cards: { ...state.cards, [cardId]: { ...card, comments: [...card.comments, comment], updatedAt: now } } }
        })
      },

      updateComment: (cardId, commentId, text) => {
        set((state) => {
          const card = state.cards[cardId]
          if (!card) return state
          return { cards: { ...state.cards, [cardId]: { ...card, comments: card.comments.map((c) => c.id === commentId ? { ...c, text, updatedAt: new Date().toISOString() } : c), updatedAt: new Date().toISOString() } } }
        })
      },

      deleteComment: (cardId, commentId) => {
        set((state) => {
          const card = state.cards[cardId]
          if (!card) return state
          return { cards: { ...state.cards, [cardId]: { ...card, comments: card.comments.filter((c) => c.id !== commentId), updatedAt: new Date().toISOString() } } }
        })
      },

      addLabelToCard: (cardId, label) => {
        set((state) => {
          const card = state.cards[cardId]
          if (!card) return state
          if (card.labels.some((l) => l.id === label.id)) return state
          return { cards: { ...state.cards, [cardId]: { ...card, labels: [...card.labels, label], updatedAt: new Date().toISOString() } } }
        })
      },

      removeLabelFromCard: (cardId, labelId) => {
        set((state) => {
          const card = state.cards[cardId]
          if (!card) return state
          return { cards: { ...state.cards, [cardId]: { ...card, labels: card.labels.filter((l) => l.id !== labelId), updatedAt: new Date().toISOString() } } }
        })
      },

      addAttachment: (cardId, data) => {
        const attachment: Attachment = { ...data, id: createId(), createdAt: new Date().toISOString() }
        set((state) => {
          const card = state.cards[cardId]
          if (!card) return state
          return { cards: { ...state.cards, [cardId]: { ...card, attachments: [...(card.attachments ?? []), attachment], updatedAt: new Date().toISOString() } } }
        })
      },

      removeAttachment: (cardId, attachmentId) => {
        set((state) => {
          const card = state.cards[cardId]
          if (!card) return state
          return { cards: { ...state.cards, [cardId]: { ...card, attachments: (card.attachments ?? []).filter((a) => a.id !== attachmentId), updatedAt: new Date().toISOString() } } }
        })
      },

      reorderBoards: (boardOrder) => {
        set({ boardOrder })
      },

      duplicateCard: (cardId) => {
        if (!get().cards[cardId]) return null
        const newId = createId()
        const now = new Date().toISOString()
        set((s) => {
          const card = s.cards[cardId]
          if (!card) return s
          const col = s.columns[card.columnId]
          if (!col) return s
          const newCard: Card = {
            ...card,
            id: newId,
            title: card.title + ' (copy)',
            subtasks: card.subtasks.map((st) => ({ ...st, id: createId(), completed: false })),
            checklists: (card.checklists ?? []).map((cl) => ({
              ...cl, id: createId(),
              items: cl.items.map((i) => ({ ...i, id: createId(), completed: false }))
            })),
            comments: [],
            attachments: [...(card.attachments ?? [])],
            completed: false,
            coverImageId: undefined,
            createdAt: now,
            updatedAt: now,
          }
          return {
            cards: { ...s.cards, [newId]: newCard },
            columns: {
              ...s.columns,
              [card.columnId]: {
                ...col,
                cardIds: [...col.cardIds, newId],
                updatedAt: now
              }
            }
          }
        })
        return newId
      },

      pasteCardsToColumn: (cardIds, targetColumnId) => {
        const state = get()
        const targetCol = state.columns[targetColumnId]
        if (!targetCol) return []
        const now = new Date().toISOString()
        const newIds: string[] = []
        const newCards: Record<string, Card> = {}

        for (const cardId of cardIds) {
          const card = state.cards[cardId]
          if (!card) continue
          const newId = createId()
          newCards[newId] = {
            ...card,
            id: newId,
            columnId: targetColumnId,
            boardId: targetCol.boardId,
            title: card.title + ' (copy)',
            subtasks: card.subtasks.map((s) => ({ ...s, id: createId(), completed: false })),
            checklists: (card.checklists ?? []).map((cl) => ({
              ...cl, id: createId(),
              items: cl.items.map((i) => ({ ...i, id: createId(), completed: false }))
            })),
            comments: [],
            attachments: [...(card.attachments ?? [])],
            completed: false,
            pinned: false,
            coverImageId: undefined,
            createdAt: now,
            updatedAt: now,
          }
          newIds.push(newId)
        }

        if (newIds.length === 0) return []

        set((s) => {
          const col = s.columns[targetColumnId]
          if (!col) return s
          return {
            cards: { ...s.cards, ...newCards },
            columns: {
              ...s.columns,
              [targetColumnId]: {
                ...col,
                cardIds: [...col.cardIds, ...newIds],
                updatedAt: now
              }
            }
          }
        })
        return newIds
      },

      sortColumnCards: (columnId, sortBy) => {
        const priorityOrder: Record<Priority, number> = { urgent: 0, high: 1, medium: 2, low: 3, none: 4 }
        set((state) => {
          const col = state.columns[columnId]
          if (!col) return state
          const pinnedIds = col.cardIds.filter((id) => state.cards[id]?.pinned)
          const unpinnedIds = col.cardIds.filter((id) => !state.cards[id]?.pinned)
          const sortedUnpinned = [...unpinnedIds].sort((a, b) => {
            const ca = state.cards[a]
            const cb = state.cards[b]
            if (!ca || !cb) return 0
            switch (sortBy) {
              case 'priority': return priorityOrder[ca.priority] - priorityOrder[cb.priority]
              case 'dueDate': {
                if (!ca.dueDate && !cb.dueDate) return 0
                if (!ca.dueDate) return 1
                if (!cb.dueDate) return -1
                return new Date(ca.dueDate).getTime() - new Date(cb.dueDate).getTime()
              }
              case 'title': return ca.title.localeCompare(cb.title)
              case 'created': return new Date(cb.createdAt).getTime() - new Date(ca.createdAt).getTime()
              default: return 0
            }
          })
          return { columns: { ...state.columns, [columnId]: { ...col, cardIds: [...pinnedIds, ...sortedUnpinned], updatedAt: new Date().toISOString() } } }
        })
      },

      bulkSetPriority: (cardIds, priority) => {
        set((state) => {
          const now = new Date().toISOString()
          const newCards = { ...state.cards }
          for (const id of cardIds) {
            if (newCards[id]) newCards[id] = { ...newCards[id], priority, updatedAt: now }
          }
          return { cards: newCards }
        })
      },

      bulkAddLabel: (cardIds, label) => {
        set((state) => {
          const now = new Date().toISOString()
          const newCards = { ...state.cards }
          for (const id of cardIds) {
            const card = newCards[id]
            if (card && !card.labels.some((l) => l.id === label.id)) {
              newCards[id] = { ...card, labels: [...card.labels, label], updatedAt: now }
            }
          }
          return { cards: newCards }
        })
      },

      bulkMoveToColumn: (cardIds, columnId) => {
        set((state) => {
          const now = new Date().toISOString()
          const newCards = { ...state.cards }
          const newColumns = { ...state.columns }
          const cardIdSet = new Set(cardIds)
          const sourceColumns = new Set<string>()
          for (const cid of cardIds) {
            const card = state.cards[cid]
            if (!card) continue
            sourceColumns.add(card.columnId)
            newCards[cid] = { ...card, columnId, updatedAt: now }
          }
          for (const colId of Array.from(sourceColumns)) {
            newColumns[colId] = {
              ...newColumns[colId] ?? state.columns[colId],
              cardIds: (newColumns[colId] ?? state.columns[colId]).cardIds.filter((id) => !cardIdSet.has(id)),
              updatedAt: now
            }
          }
          const targetCol = newColumns[columnId] ?? state.columns[columnId]
          if (!targetCol) return state
          const existingIds = targetCol.cardIds.filter((id) => !cardIdSet.has(id))
          newColumns[columnId] = { ...targetCol, cardIds: [...existingIds, ...cardIds], updatedAt: now }
          return { cards: newCards, columns: newColumns }
        })
      },

      bulkDelete: (cardIds) => {
        set((state) => {
          const now = new Date().toISOString()
          const newCards = { ...state.cards }
          const newColumns = { ...state.columns }
          const cardIdSet = new Set(cardIds)
          for (const cid of cardIds) {
            const card = state.cards[cid]
            if (!card) continue
            const col = newColumns[card.columnId] ?? state.columns[card.columnId]
            if (col) {
              newColumns[card.columnId] = { ...col, cardIds: col.cardIds.filter((id) => !cardIdSet.has(id)), updatedAt: now }
            }
            delete newCards[cid]
          }
          return { cards: newCards, columns: newColumns }
        })
      },

      bulkSetCompleted: (cardIds, completed) => {
        set((state) => {
          const now = new Date().toISOString()
          const newCards = { ...state.cards }
          for (const id of cardIds) {
            if (newCards[id]) newCards[id] = { ...newCards[id], completed, updatedAt: now }
          }
          return { cards: newCards }
        })
      },

      createLabel: (name, color, emoji?) => {
        const id = createId()
        const label: Label = { id, name, color }
        if (emoji) label.emoji = emoji
        set((state) => ({ globalLabels: [...state.globalLabels, label] }))
        return id
      },

      updateLabel: (id, updates) => {
        set((state) => ({
          globalLabels: state.globalLabels.map((l) => (l.id === id ? { ...l, ...updates } : l))
        }))
      },

      deleteLabel: (id) => {
        set((state) => {
          const newCards = { ...state.cards }
          for (const cardId of Object.keys(newCards)) {
            const card = newCards[cardId]
            if (!card) continue
            if (card.labels.some((l) => l.id === id)) {
              newCards[cardId] = { ...card, labels: card.labels.filter((l) => l.id !== id) }
            }
          }
          return { globalLabels: state.globalLabels.filter((l) => l.id !== id), cards: newCards }
        })
      }
    }),
    {
      name: 'flowzik-board-data',
      storage: createJSONStorage(() => electronStoreStorage),
      partialize: (state) => ({
        boards: state.boards,
        columns: state.columns,
        cards: state.cards,
        boardOrder: state.boardOrder,
        globalLabels: state.globalLabels
      }),
      onRehydrateStorage: () => () => {
        // Clear undo history after hydration so Ctrl+Z doesn't undo the data load
        ;(useBoardStore as any).temporal?.getState()?.clear()
      }
    }
  ),
  {
    limit: 50,
    partialize: (state) => {
      const { boards, columns, cards, boardOrder, globalLabels } = state
      return { boards, columns, cards, boardOrder, globalLabels }
    },
    equality: (pastState, currentState) => JSON.stringify(pastState) === JSON.stringify(currentState)
  }
  )
)
