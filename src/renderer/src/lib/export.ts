import { useBoardStore } from '@/store/board-store'
import { useArchiveStore } from '@/store/archive-store'
import { useAppStore } from '@/store/app-store'
import { useStickyStore } from '@/store/sticky-store'
import type { ExportData } from '@/types'

export function exportToJSON(): string {
  const { boards, columns, cards, globalLabels } = useBoardStore.getState()
  const { archivedCards, archivedColumns } = useArchiveStore.getState()

  const data: ExportData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    boards: Object.values(boards),
    columns,
    cards,
    archivedCards: Object.values(archivedCards),
    archivedColumns: Object.values(archivedColumns),
    globalLabels
  }

  return JSON.stringify(data, null, 2)
}

export function exportBoardToJSON(boardId: string): string {
  const { boards, columns, cards, globalLabels } = useBoardStore.getState()
  const board = boards[boardId]
  if (!board) return '{}'

  const boardColumns: Record<string, typeof columns[string]> = {}
  const boardCards: Record<string, typeof cards[string]> = {}

  for (const colId of board.columnOrder) {
    const col = columns[colId]
    if (!col) continue
    boardColumns[colId] = col
    for (const cardId of col.cardIds) {
      if (cards[cardId]) boardCards[cardId] = cards[cardId]
    }
  }

  const data = {
    version: 1,
    exportedAt: new Date().toISOString(),
    boards: [board],
    columns: boardColumns,
    cards: boardCards,
    archivedCards: [],
    archivedColumns: [],
    globalLabels
  }

  return JSON.stringify(data, null, 2)
}

export function exportBoardToCSV(boardId: string): string {
  const { boards, columns, cards } = useBoardStore.getState()
  const board = boards[boardId]
  if (!board) return ''

  const rows: string[][] = [
    ['Column', 'Title', 'Description', 'Priority', 'Due Date', 'Labels', 'Subtasks', 'Completed', 'Attachments', 'Created']
  ]

  for (const colId of board.columnOrder) {
    const col = columns[colId]
    if (!col) continue
    for (const cardId of col.cardIds) {
      const card = cards[cardId]
      if (!card) continue
      const subtasksDone = card.subtasks.filter((s) => s.completed).length
      rows.push([
        col.title,
        card.title,
        card.description.replace(/\n/g, ' '),
        card.priority,
        card.dueDate ?? '',
        card.labels.map((l) => l.name).join('; '),
        `${subtasksDone}/${card.subtasks.length}`,
        card.completed ? 'Yes' : 'No',
        String(card.attachments?.length ?? 0),
        card.createdAt
      ])
    }
  }

  return rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n')
}

export function exportBoardToPdfHtml(boardId: string): string {
  const { boards, columns, cards, globalLabels } = useBoardStore.getState()
  const board = boards[boardId]
  if (!board) return ''

  const theme = useAppStore.getState().theme
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  const stickyNotes = useStickyStore.getState().getStickyNotesForBoard(boardId)
  const labelMap = new Map(globalLabels.map((l) => [l.id, l]))

  // Theme colors
  const bg = isDark ? '#1a1b2e' : '#ffffff'
  const surfaceBg = isDark ? '#232438' : '#f9fafb'
  const cardBg = isDark ? '#2a2b42' : '#ffffff'
  const borderColor = isDark ? '#3a3b55' : '#e5e7eb'
  const textPrimary = isDark ? '#e8e8f0' : '#1f2937'
  const textSecondary = isDark ? '#9899b0' : '#6b7280'
  const textTertiary = isDark ? '#6a6b85' : '#9ca3af'

  const columnsHtml = board.columnOrder.map((colId) => {
    const col = columns[colId]
    if (!col) return ''
    const cardsHtml = col.cardIds.map((cardId) => {
      const card = cards[cardId]
      if (!card) return ''
      const priorityColors: Record<string, string> = {
        low: '#3b82f6', medium: '#f59e0b', high: '#f97316', urgent: '#ef4444'
      }
      const labelsHtml = card.labels.length > 0
        ? `<div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:4px">${card.labels.map((l) => {
            const gl = labelMap.get(l.id)
            const color = gl?.color ?? l.color ?? '#888'
            return `<span style="background:${color}22;color:${color};font-size:10px;padding:1px 6px;border-radius:4px">${escapeHtml(l.name)}</span>`
          }).join('')}</div>`
        : ''
      const subtasksHtml = card.subtasks.length > 0
        ? `<div style="font-size:11px;color:${textTertiary};margin-top:4px">${card.subtasks.filter((s) => s.completed).length}/${card.subtasks.length} subtasks</div>`
        : ''
      const dueHtml = card.dueDate
        ? `<div style="font-size:11px;color:${textTertiary};margin-top:2px">Due: ${new Date(card.dueDate).toLocaleDateString()}</div>`
        : ''
      return `<div style="background:${cardBg};border:1px solid ${borderColor};border-radius:8px;padding:10px;margin-bottom:8px;border-left:3px solid ${priorityColors[card.priority] ?? borderColor}">
        ${labelsHtml}
        <div style="font-size:13px;font-weight:600;color:${textPrimary}${card.completed ? ';text-decoration:line-through;opacity:0.6' : ''}">${escapeHtml(card.title)}</div>
        ${card.description ? `<div style="font-size:11px;color:${textSecondary};margin-top:4px;white-space:pre-wrap;max-height:60px;overflow:hidden">${escapeHtml(card.description.slice(0, 200))}</div>` : ''}
        ${subtasksHtml}${dueHtml}
      </div>`
    }).join('')

    const colorBar = col.color ? `style="background:${col.color};height:3px;border-radius:3px 3px 0 0"` : ''
    return `<div style="flex:0 0 260px;background:${surfaceBg};border-radius:10px;border:1px solid ${borderColor};overflow:hidden">
      ${col.color ? `<div ${colorBar}></div>` : ''}
      <div style="padding:12px 10px 6px;font-weight:700;font-size:13px;color:${textPrimary};display:flex;justify-content:space-between;align-items:center">
        <span>${escapeHtml(col.title)}</span>
        <span style="font-size:11px;font-weight:400;color:${textTertiary}">${col.cardIds.length}</span>
      </div>
      <div style="padding:0 10px 10px">${cardsHtml}</div>
    </div>`
  }).join('')

  // Sticky notes HTML
  const stickiesHtml = stickyNotes.length > 0
    ? `<div style="margin-top:24px;display:flex;gap:12px;flex-wrap:wrap">${stickyNotes.map((note) =>
        `<div style="width:${note.width}px;min-height:80px;background:${note.color};border-radius:6px;padding:10px;box-shadow:0 2px 8px rgba(0,0,0,0.15);font-size:12px;color:#1a1a1a;white-space:pre-wrap;transform:rotate(${Math.random() * 4 - 2}deg)">${escapeHtml(note.text)}</div>`
      ).join('')}</div>`
    : ''

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    @page { size: A4 landscape; margin: 0.4in; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 20px; background: ${bg}; }
    h1 { font-size: 18px; color: ${textPrimary}; margin: 0 0 4px; }
    .date { font-size: 11px; color: ${textTertiary}; margin-bottom: 16px; }
  </style></head><body>
    <h1>${escapeHtml(board.title)}</h1>
    <div class="date">${new Date().toLocaleDateString()} &middot; FlowZik</div>
    <div style="display:flex;gap:12px;align-items:flex-start;overflow:visible;flex-wrap:wrap">
      ${columnsHtml}
    </div>
    ${stickiesHtml}
  </body></html>`
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export function importFromJSON(jsonString: string): void {
  let data: ExportData
  try {
    data = JSON.parse(jsonString)
  } catch {
    throw new Error('Invalid JSON format')
  }
  if (!data.version || !data.boards || !data.columns || !data.cards) {
    throw new Error('Invalid export file format')
  }

  const boardStore = useBoardStore.getState()

  const boardsMap: Record<string, (typeof data.boards)[0]> = {}
  for (const board of data.boards) {
    boardsMap[board.id] = board
  }

  // Merge labels by ID: imported labels override existing ones with same ID, keep the rest
  const importedLabels = data.globalLabels ?? []
  const importedLabelIds = new Set(importedLabels.map((l) => l.id))
  const mergedLabels = [
    ...boardStore.globalLabels.filter((l) => !importedLabelIds.has(l.id)),
    ...importedLabels
  ]

  useBoardStore.setState({
    boards: { ...boardStore.boards, ...boardsMap },
    columns: { ...boardStore.columns, ...data.columns },
    cards: { ...boardStore.cards, ...data.cards },
    boardOrder: [...new Set([...boardStore.boardOrder, ...data.boards.map((b) => b.id)])],
    globalLabels: mergedLabels
  })
}
