import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { electronStoreStorage } from './storage-adapter'
import { createId } from '@/lib/id'
import type { Automation, AutomationTrigger, AutomationAction } from '@/types'

interface AutomationState {
  automations: Automation[]

  createAutomation: (boardId: string, name: string, trigger: AutomationTrigger, actions: AutomationAction[]) => string
  updateAutomation: (id: string, updates: Partial<Pick<Automation, 'name' | 'trigger' | 'actions' | 'enabled'>>) => void
  deleteAutomation: (id: string) => void
  getAutomationsForBoard: (boardId: string) => Automation[]
}

export const useAutomationStore = create<AutomationState>()(
  persist(
    (set, get) => ({
      automations: [],

      createAutomation: (boardId, name, trigger, actions) => {
        const id = createId()
        const automation: Automation = {
          id,
          boardId,
          name,
          enabled: true,
          trigger,
          actions,
          createdAt: new Date().toISOString()
        }
        set((state) => ({
          automations: [...state.automations, automation]
        }))
        return id
      },

      updateAutomation: (id, updates) => {
        set((state) => ({
          automations: state.automations.map((a) =>
            a.id === id ? { ...a, ...updates } : a
          )
        }))
      },

      deleteAutomation: (id) => {
        set((state) => ({
          automations: state.automations.filter((a) => a.id !== id)
        }))
      },

      getAutomationsForBoard: (boardId) => {
        return get().automations.filter((a) => a.boardId === boardId)
      }
    }),
    {
      name: 'flowzik-automations',
      storage: createJSONStorage(() => electronStoreStorage),
      partialize: (state) => ({
        automations: state.automations
      })
    }
  )
)
