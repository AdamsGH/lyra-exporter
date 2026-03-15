import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, Component, type ReactNode, type ErrorInfo } from 'react'
import { PageShell } from '@/components/layout/PageShell'
import { WelcomePage } from '@/pages/WelcomePage'
import { ListPage } from '@/pages/ListPage'
import { TimelinePage } from '@/pages/TimelinePage'
import { useSync } from '@/hooks/useSync'
import { usePostMessage } from '@/hooks/usePostMessage'
import { useFilesStore } from '@/stores/filesStore'
import { getAllCachedFiles } from '@/lib/storage'
import type { LoadedFile } from '@/stores/filesStore'
import { extractChatData, detectBranches, detectFileFormat } from '@/parsers/index'
import { FloatPanel, FloatPanelTrigger } from '@/ai-chat/index'
import '@/ai-chat/styles.css'

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function parseRaw(raw: unknown, name: string): Partial<LoadedFile> {
  try {
    const format = detectFileFormat(raw)
    if (format === 'unknown') return { platform: 'unknown' }
    const extracted = extractChatData(raw, name)
    const parsed = detectBranches(extracted)
    return { parsed, platform: (parsed as { platform?: string })?.platform ?? format }
  } catch {
    return { platform: 'unknown' }
  }
}

class AppErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  constructor(props: { children: ReactNode }) { super(props); this.state = { error: null } }
  static getDerivedStateFromError(error: Error) { return { error } }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error('App crash:', error, info) }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 32, fontFamily: 'monospace', background: '#1a1a1a', color: '#f5f5f5', minHeight: '100vh' }}>
          <h2 style={{ color: '#f87171', marginBottom: 16 }}>Application Error</h2>
          <pre style={{ fontSize: 12, whiteSpace: 'pre-wrap', maxWidth: 900 }}>
            {this.state.error.message}{'\n\n'}{this.state.error.stack}
          </pre>
          <button
            onClick={() => this.setState({ error: null })}
            style={{ marginTop: 16, padding: '8px 16px', background: '#d97706', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}
          >
            Retry
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

function AppInner() {
  useSync()
  usePostMessage()
  const { files, addFiles, setHydrated, isHydrating } = useFilesStore()
  const hasFiles = files.length > 0

  // Restore from IndexedDB on first mount, always call setHydrated when done
  useEffect(() => {
    getAllCachedFiles()
      .then((cached) => {
        if (cached.length > 0) {
          const loaded: LoadedFile[] = cached.map(({ name, raw }) => ({
            id: generateId(),
            name,
            raw,
            loadedAt: Date.now(),
            ...parseRaw(raw, name),
          }))
          addFiles(loaded)
        }
      })
      .catch(console.error)
      .finally(() => setHydrated())
  // Run once on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (isHydrating) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 700, background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', letterSpacing: 3, marginBottom: 16 }}>
            LYRA
          </div>
          <div style={{ width: 32, height: 32, border: '2px solid var(--border-primary)', borderTopColor: 'var(--accent-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
        </div>
      </div>
    )
  }

  return (
    <>
      <PageShell>
        <Routes>
          <Route path="/" element={hasFiles ? <Navigate to="/list" replace /> : <WelcomePage />} />
          <Route path="/list" element={<ListPage />} />
          <Route path="/timeline/:fileId" element={<TimelinePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </PageShell>
      <FloatPanel />
      <FloatPanelTrigger position="bottom-left" />
    </>
  )
}

export default function App() {
  return (
    <AppErrorBoundary>
      <AppInner />
    </AppErrorBoundary>
  )
}
