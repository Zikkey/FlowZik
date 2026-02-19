import { ReactNode } from 'react'
import { PanelLeftOpen } from 'lucide-react'
import { Titlebar } from './Titlebar'
import { Sidebar } from './Sidebar'
import { useAppStore } from '@/store'

interface AppLayoutProps {
  children: ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const sidebarOpen = useAppStore((s) => s.sidebarOpen)
  const toggleSidebar = useAppStore((s) => s.toggleSidebar)

  return (
    <div className="h-full flex flex-col">
      <Titlebar />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        <main data-tutorial="main-content" className="flex-1 flex flex-col overflow-hidden relative">
          {!sidebarOpen && (
            <button
              onClick={toggleSidebar}
              className="absolute top-3 left-3 z-10 p-1.5 rounded-md bg-surface-secondary border border-border text-content-tertiary hover:text-content-primary hover:bg-surface-tertiary transition-colors"
            >
              <PanelLeftOpen size={16} />
            </button>
          )}
          {children}
        </main>
      </div>
    </div>
  )
}
