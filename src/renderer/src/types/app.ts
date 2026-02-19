import type { Card, Column, Board, Label } from './board'

export type Theme = 'light' | 'dark' | 'system'
export type Language = 'en' | 'ru'
export type ViewMode = 'kanban' | 'table' | 'heatmap' | 'timeline'

export interface ArchivedCard extends Card {
  archivedAt: string
  originalColumnId: string
  originalColumnTitle: string
}

export interface ArchivedColumn extends Column {
  archivedAt: string
  cards: Card[]
}

export interface ExportData {
  version: number
  exportedAt: string
  boards: Board[]
  columns: Record<string, Column>
  cards: Record<string, Card>
  archivedCards: ArchivedCard[]
  archivedColumns: ArchivedColumn[]
  globalLabels: Label[]
}
