import { createServer, IncomingMessage, ServerResponse, Server } from 'http'
import { BrowserWindow } from 'electron'

const PORT = 9712
const ALLOWED_HOSTS = new Set(['localhost', '127.0.0.1', `localhost:${PORT}`, `127.0.0.1:${PORT}`])

type StoreAccessor = {
  get: (key: string) => unknown
  set: (key: string, value: unknown) => void
}

let server: Server | null = null
let storeRef: StoreAccessor | null = null

function nanoid(size = 12): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let id = ''
  const bytes = require('crypto').randomBytes(size)
  for (let i = 0; i < size; i++) id += chars[bytes[i] % chars.length]
  return id
}

// ── Data helpers ────────────────────────────────

const VALID_PRIORITIES = new Set(['none', 'low', 'medium', 'high', 'urgent'])

interface BoardData {
  boards: Record<string, any>
  columns: Record<string, any>
  cards: Record<string, any>
  boardOrder: string[]
  globalLabels: any[]
}

function readStore(): BoardData {
  const raw = storeRef!.get('flowzik-board-data')
  if (!raw || typeof raw !== 'string') {
    return { boards: {}, columns: {}, cards: {}, boardOrder: [], globalLabels: [] }
  }
  try {
    const parsed = JSON.parse(raw)
    return parsed.state ?? parsed
  } catch {
    return { boards: {}, columns: {}, cards: {}, boardOrder: [], globalLabels: [] }
  }
}

function writeStore(data: BoardData): void {
  const raw = storeRef!.get('flowzik-board-data')
  let version = 0
  if (raw && typeof raw === 'string') {
    try { version = JSON.parse(raw).version ?? 0 } catch { /* ok */ }
  }
  storeRef!.set('flowzik-board-data', JSON.stringify({ state: data, version }))
  // Notify renderer to rehydrate
  const win = BrowserWindow.getAllWindows()[0]
  if (win) win.webContents.send('store:external-update')
}

// ── Request helpers ─────────────────────────────

function json(res: ServerResponse, data: unknown, status = 200): void {
  res.writeHead(status, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' })
  res.end(JSON.stringify(data))
}

function error(res: ServerResponse, message: string, status = 400): void {
  json(res, { error: message }, status)
}

async function readBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', (chunk: Buffer) => { body += chunk.toString() })
    req.on('end', () => {
      if (!body) return resolve({})
      try { resolve(JSON.parse(body)) }
      catch { reject(new Error('Invalid JSON body')) }
    })
    req.on('error', reject)
  })
}

function matchRoute(url: string, pattern: string): Record<string, string> | null {
  const urlParts = url.split('/')
  const patternParts = pattern.split('/')
  if (urlParts.length !== patternParts.length) return null
  const params: Record<string, string> = {}
  for (let i = 0; i < patternParts.length; i++) {
    if (patternParts[i].startsWith(':')) {
      params[patternParts[i].slice(1)] = urlParts[i]
    } else if (patternParts[i] !== urlParts[i]) {
      return null
    }
  }
  return params
}

// ── Route handlers ──────────────────────────────

async function handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
  // Security: check Host header
  const host = req.headers.host ?? ''
  if (!ALLOWED_HOSTS.has(host)) {
    return error(res, 'Forbidden', 403)
  }

  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    })
    return res.end()
  }

  const url = (req.url ?? '/').split('?')[0]
  const method = req.method ?? 'GET'
  let params: Record<string, string> | null

  // ── GET /api/boards ──
  if (method === 'GET' && url === '/api/boards') {
    const data = readStore()
    const boards = data.boardOrder.map((id) => {
      const board = data.boards[id]
      if (!board) return null
      const cols = board.columnOrder.map((colId: string) => {
        const col = data.columns[colId]
        if (!col) return null
        return { id: col.id, title: col.title, color: col.color, cardCount: col.cardIds.length }
      }).filter(Boolean)
      return { id: board.id, title: board.title, icon: board.icon, columns: cols }
    }).filter(Boolean)
    return json(res, boards)
  }

  // ── POST /api/boards ──
  if (method === 'POST' && url === '/api/boards') {
    const body = await readBody(req)
    const data = readStore()
    const now = new Date().toISOString()
    const id = nanoid()

    // Create default columns if not specified
    const defaultCols = body.columns ?? [
      { title: 'Бэклог', color: '#6366f1' },
      { title: 'В работе', color: '#f59e0b' },
      { title: 'Тестирование', color: '#8b5cf6' },
      { title: 'Готово', color: '#10b981' }
    ]

    const columnOrder: string[] = []
    for (const colDef of defaultCols) {
      const colId = nanoid()
      data.columns[colId] = {
        id: colId,
        boardId: id,
        title: colDef.title ?? 'New column',
        cardIds: [],
        color: colDef.color,
        createdAt: now,
        updatedAt: now
      }
      columnOrder.push(colId)
    }

    const board = {
      id,
      title: body.title ?? 'New board',
      icon: body.icon ?? '📋',
      columnOrder,
      createdAt: now,
      updatedAt: now
    }

    data.boards[id] = board
    data.boardOrder = [...data.boardOrder, id]
    writeStore(data)

    const cols = columnOrder.map((colId) => {
      const col = data.columns[colId]
      return { id: col.id, title: col.title, color: col.color }
    })
    return json(res, { ...board, columns: cols }, 201)
  }

  // ── DELETE /api/boards/:boardId ──
  if (method === 'DELETE' && (params = matchRoute(url, '/api/boards/:boardId'))) {
    const data = readStore()
    const board = data.boards[params.boardId]
    if (!board) return error(res, 'Board not found', 404)

    // Remove all cards in this board's columns
    for (const colId of board.columnOrder) {
      const col = data.columns[colId]
      if (col) {
        for (const cardId of col.cardIds) {
          delete data.cards[cardId]
        }
        delete data.columns[colId]
      }
    }

    delete data.boards[params.boardId]
    data.boardOrder = data.boardOrder.filter((id: string) => id !== params!.boardId)
    writeStore(data)
    return json(res, { ok: true })
  }

  // ── GET /api/boards/:boardId ──
  if (method === 'GET' && (params = matchRoute(url, '/api/boards/:boardId'))) {
    const data = readStore()
    const board = data.boards[params.boardId]
    if (!board) return error(res, 'Board not found', 404)
    const columns = board.columnOrder.map((colId: string) => {
      const col = data.columns[colId]
      if (!col) return null
      const cards = col.cardIds.map((cardId: string) => {
        const card = data.cards[cardId]
        if (!card) return null
        return card
      }).filter(Boolean)
      return { ...col, cards }
    }).filter(Boolean)
    return json(res, { ...board, columns })
  }

  // ── GET /api/cards/:cardId ──
  if (method === 'GET' && (params = matchRoute(url, '/api/cards/:cardId'))) {
    const data = readStore()
    const card = data.cards[params.cardId]
    if (!card) return error(res, 'Card not found', 404)
    return json(res, card)
  }

  // ── POST /api/boards/:boardId/cards ──
  if (method === 'POST' && (params = matchRoute(url, '/api/boards/:boardId/cards'))) {
    const body = await readBody(req)
    const data = readStore()
    const board = data.boards[params.boardId]
    if (!board) return error(res, 'Board not found', 404)

    const columnId = body.columnId
    const col = data.columns[columnId]
    if (!col || col.boardId !== params.boardId) return error(res, 'Column not found in this board', 404)

    const now = new Date().toISOString()
    const id = nanoid()
    const card = {
      id,
      columnId,
      boardId: params.boardId,
      title: body.title ?? 'Untitled',
      description: body.description ?? '',
      labels: body.labels ?? [],
      priority: VALID_PRIORITIES.has(body.priority) ? body.priority : 'none',
      dueDate: body.dueDate ?? null,
      subtasks: (body.subtasks ?? []).map((s: any) => ({
        id: nanoid(), title: s.title ?? s, completed: s.completed ?? false, createdAt: now
      })),
      comments: [],
      attachments: [],
      completed: false,
      createdAt: now,
      updatedAt: now
    }

    data.cards[id] = card
    data.columns[columnId] = { ...col, cardIds: [...col.cardIds, id], updatedAt: now }
    writeStore(data)
    return json(res, card, 201)
  }

  // ── POST /api/boards/:boardId/columns ──
  if (method === 'POST' && (params = matchRoute(url, '/api/boards/:boardId/columns'))) {
    const body = await readBody(req)
    const data = readStore()
    const board = data.boards[params.boardId]
    if (!board) return error(res, 'Board not found', 404)

    const now = new Date().toISOString()
    const id = nanoid()
    const col = {
      id,
      boardId: params.boardId,
      title: body.title ?? 'New column',
      cardIds: [],
      color: body.color,
      createdAt: now,
      updatedAt: now
    }

    data.columns[id] = col
    data.boards[params.boardId] = { ...board, columnOrder: [...board.columnOrder, id], updatedAt: now }
    writeStore(data)
    return json(res, col, 201)
  }

  // ── PATCH /api/cards/:cardId ──
  if (method === 'PATCH' && (params = matchRoute(url, '/api/cards/:cardId'))) {
    const body = await readBody(req)
    const data = readStore()
    const card = data.cards[params.cardId]
    if (!card) return error(res, 'Card not found', 404)

    const allowed = ['title', 'description', 'priority', 'dueDate', 'labels', 'completed', 'subtasks']
    const now = new Date().toISOString()
    for (const key of allowed) {
      if (key in body) {
        if (key === 'subtasks') {
          card.subtasks = body.subtasks.map((s: any) => ({
            id: s.id ?? nanoid(),
            title: s.title ?? s,
            completed: s.completed ?? false,
            createdAt: s.createdAt ?? now
          }))
        } else if (key === 'priority') {
          if (VALID_PRIORITIES.has(body[key])) (card as any)[key] = body[key]
        } else {
          (card as any)[key] = body[key]
        }
      }
    }
    card.updatedAt = now
    data.cards[params.cardId] = card
    writeStore(data)
    return json(res, card)
  }

  // ── DELETE /api/cards/:cardId ──
  if (method === 'DELETE' && (params = matchRoute(url, '/api/cards/:cardId'))) {
    const data = readStore()
    const card = data.cards[params.cardId]
    if (!card) return error(res, 'Card not found', 404)

    const col = data.columns[card.columnId]
    if (col) {
      col.cardIds = col.cardIds.filter((id: string) => id !== params!.cardId)
      col.updatedAt = new Date().toISOString()
    }
    delete data.cards[params.cardId]
    writeStore(data)
    return json(res, { ok: true })
  }

  // ── POST /api/cards/:cardId/move ──
  if (method === 'POST' && (params = matchRoute(url, '/api/cards/:cardId/move'))) {
    const body = await readBody(req)
    const data = readStore()
    const card = data.cards[params.cardId]
    if (!card) return error(res, 'Card not found', 404)

    const toColumnId = body.columnId
    const toCol = data.columns[toColumnId]
    if (!toCol) return error(res, 'Target column not found', 404)

    const now = new Date().toISOString()

    // Remove from current column
    const fromCol = data.columns[card.columnId]
    if (fromCol) {
      fromCol.cardIds = fromCol.cardIds.filter((id: string) => id !== params!.cardId)
      fromCol.updatedAt = now
    }

    // Add to target column
    const index = body.index ?? toCol.cardIds.length
    toCol.cardIds.splice(Math.min(index, toCol.cardIds.length), 0, params.cardId)
    toCol.updatedAt = now

    card.columnId = toColumnId
    card.updatedAt = now
    writeStore(data)
    return json(res, card)
  }

  // ── POST /api/cards/:cardId/subtasks ──
  if (method === 'POST' && (params = matchRoute(url, '/api/cards/:cardId/subtasks'))) {
    const body = await readBody(req)
    const data = readStore()
    const card = data.cards[params.cardId]
    if (!card) return error(res, 'Card not found', 404)

    const now = new Date().toISOString()
    const subtask = {
      id: nanoid(),
      title: body.title ?? 'Subtask',
      completed: body.completed ?? false,
      createdAt: now
    }
    card.subtasks = [...(card.subtasks ?? []), subtask]
    card.updatedAt = now
    writeStore(data)
    return json(res, subtask, 201)
  }

  // ── PATCH /api/cards/:cardId/subtasks/:subtaskId ──
  if (method === 'PATCH' && (params = matchRoute(url, '/api/cards/:cardId/subtasks/:subtaskId'))) {
    const body = await readBody(req)
    const data = readStore()
    const card = data.cards[params.cardId]
    if (!card) return error(res, 'Card not found', 404)

    const subtask = (card.subtasks ?? []).find((s: any) => s.id === params!.subtaskId)
    if (!subtask) return error(res, 'Subtask not found', 404)

    if ('title' in body) subtask.title = body.title
    if ('completed' in body) subtask.completed = body.completed
    card.updatedAt = new Date().toISOString()
    writeStore(data)
    return json(res, subtask)
  }

  // ── DELETE /api/cards/:cardId/subtasks/:subtaskId ──
  if (method === 'DELETE' && (params = matchRoute(url, '/api/cards/:cardId/subtasks/:subtaskId'))) {
    const data = readStore()
    const card = data.cards[params.cardId]
    if (!card) return error(res, 'Card not found', 404)

    card.subtasks = (card.subtasks ?? []).filter((s: any) => s.id !== params!.subtaskId)
    card.updatedAt = new Date().toISOString()
    writeStore(data)
    return json(res, { ok: true })
  }

  // ── POST /api/cards/:cardId/comments ──
  if (method === 'POST' && (params = matchRoute(url, '/api/cards/:cardId/comments'))) {
    const body = await readBody(req)
    const data = readStore()
    const card = data.cards[params.cardId]
    if (!card) return error(res, 'Card not found', 404)

    const now = new Date().toISOString()
    const comment = { id: nanoid(), text: body.text ?? '', createdAt: now, updatedAt: now }
    card.comments = [...(card.comments ?? []), comment]
    card.updatedAt = now
    writeStore(data)
    return json(res, comment, 201)
  }

  error(res, 'Not found', 404)
}

// ── Start / Stop ────────────────────────────────

export function startApiServer(store: StoreAccessor): void {
  if (server) return
  storeRef = store

  server = createServer(async (req, res) => {
    try {
      await handleRequest(req, res)
    } catch (err: any) {
      error(res, err.message ?? 'Internal error', 500)
    }
  })

  server.listen(PORT, '127.0.0.1', () => {
    console.log(`FlowZik API running on http://127.0.0.1:${PORT}`)
  })

  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`Port ${PORT} already in use, API server not started`)
    } else {
      console.error('API server error:', err)
    }
    server = null
  })
}

export function stopApiServer(): void {
  if (server) {
    server.close()
    server = null
    console.log('FlowZik API stopped')
  }
}

export function isApiServerRunning(): boolean {
  return server !== null
}
