export type Priority = 'none' | 'low' | 'medium' | 'high' | 'urgent'

export interface Label {
  id: string
  name: string
  color: string
  emoji?: string
}

export interface Attachment {
  id: string
  name: string
  path: string
  type: 'image' | 'file'
  size: number
  createdAt: string
}

export interface Subtask {
  id: string
  title: string
  completed: boolean
  createdAt: string
}

export interface Checklist {
  id: string
  title: string
  items: Subtask[]
}

export interface Comment {
  id: string
  text: string
  createdAt: string
  updatedAt: string
}

export interface Card {
  id: string
  columnId: string
  boardId: string
  title: string
  description: string
  labels: Label[]
  priority: Priority
  dueDate: string | null
  subtasks: Subtask[]
  checklists?: Checklist[]
  comments: Comment[]
  attachments?: Attachment[]
  completed?: boolean
  pinned?: boolean
  coverImageId?: string
  createdAt: string
  updatedAt: string
}

export interface Column {
  id: string
  boardId: string
  title: string
  cardIds: string[]
  color?: string
  showProgress?: boolean
  createdAt: string
  updatedAt: string
}

export interface StickyNote {
  id: string
  boardId: string
  text: string
  color: string
  x: number
  y: number
  width: number
  height: number
  createdAt: string
}

export interface Board {
  id: string
  title: string
  icon?: string
  folderId?: string
  columnOrder: string[]
  createdAt: string
  updatedAt: string
}
