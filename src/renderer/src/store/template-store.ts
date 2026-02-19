import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { electronStoreStorage } from './storage-adapter'
import { createId } from '@/lib/id'
import type { Priority, Label } from '@/types'

export interface CardTemplate {
  id: string
  name: string
  description: string
  priority: Priority
  labels: Label[]
  subtasks: string[] // just titles
  createdAt: string
}

interface TemplateState {
  cardTemplates: CardTemplate[]
  createCardTemplate: (template: Omit<CardTemplate, 'id' | 'createdAt'>) => string
  deleteCardTemplate: (id: string) => void
}

export const useTemplateStore = create<TemplateState>()(
  persist(
    (set) => ({
      cardTemplates: [],

      createCardTemplate: (template) => {
        const id = createId()
        const now = new Date().toISOString()
        set((state) => ({
          cardTemplates: [...state.cardTemplates, { ...template, id, createdAt: now }]
        }))
        return id
      },

      deleteCardTemplate: (id) => {
        set((state) => ({
          cardTemplates: state.cardTemplates.filter((t) => t.id !== id)
        }))
      }
    }),
    {
      name: 'flowzik-templates',
      storage: createJSONStorage(() => electronStoreStorage)
    }
  )
)
