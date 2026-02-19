import { useEffect, Component, type ReactNode } from 'react'
import { AppLayout } from '@/components/layout/AppLayout'
import { BoardView } from '@/components/board/BoardView'
import { Dashboard } from '@/components/dashboard/Dashboard'
import { CardDetailModal } from '@/components/card-detail/CardDetailModal'
import { ArchivePanel } from '@/components/archive/ArchivePanel'
import { SettingsModal } from '@/components/settings/SettingsModal'
import { SearchPanel } from '@/components/search/SearchPanel'
import { QuickAddBar } from '@/components/board/QuickAddBar'
import { ToastContainer } from '@/components/ui/ToastContainer'
import { OnboardingTutorial } from '@/components/onboarding/OnboardingTutorial'
import { useAppStore } from '@/store'
import { useTheme } from '@/hooks/use-theme'
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts'
import { useDueNotifications } from '@/hooks/use-due-notifications'
import { useAutomationRunner } from '@/hooks/use-automation-runner'

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null }
  static getDerivedStateFromError(error: Error) { return { error } }
  componentDidCatch(error: Error) {
    console.error('React crash:', error)
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 40, color: '#ff6b6b', fontFamily: 'monospace', background: '#111', minHeight: '100vh' }}>
          <h1>React Crash</h1>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 13 }}>{this.state.error.message}{'\n'}{this.state.error.stack}</pre>
          <button onClick={() => { this.setState({ error: null }) }} style={{ marginTop: 20, padding: '8px 16px', background: '#333', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Retry</button>
        </div>
      )
    }
    return this.props.children
  }
}

export default function App() {
  useTheme()
  useKeyboardShortcuts()
  useDueNotifications()
  useAutomationRunner()
  const showDashboard = useAppStore((s) => s.showDashboard)

  // Prevent Electron/Chromium default drag-drop behavior (navigating to file)
  // Only intercept file drags — let dnd-kit handle card/column drags
  useEffect(() => {
    const handleDragOver = (e: DragEvent) => {
      if (!e.dataTransfer?.types?.includes('Files')) return
      e.preventDefault()
      const target = e.target as HTMLElement
      if (target?.closest?.('[data-dropzone]')) {
        e.dataTransfer!.dropEffect = 'copy'
      } else {
        e.dataTransfer!.dropEffect = 'none'
      }
    }
    const handleDrop = (e: DragEvent) => {
      if (!e.dataTransfer?.types?.includes('Files')) return
      const target = e.target as HTMLElement
      if (target?.closest?.('[data-dropzone]')) return
      e.preventDefault()
    }
    document.addEventListener('dragover', handleDragOver)
    document.addEventListener('drop', handleDrop)
    return () => {
      document.removeEventListener('dragover', handleDragOver)
      document.removeEventListener('drop', handleDrop)
    }
  }, [])

  return (
    <ErrorBoundary>
      <AppLayout>
        {showDashboard ? <Dashboard /> : <BoardView />}
        <CardDetailModal />
        <ArchivePanel />
        <SettingsModal />
        <SearchPanel />
        <QuickAddBar />
        <ToastContainer />
        <OnboardingTutorial />
      </AppLayout>
    </ErrorBoundary>
  )
}
