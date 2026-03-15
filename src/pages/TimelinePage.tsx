import { useState, useMemo, useRef, useEffect, Component, type ReactNode, type ErrorInfo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useFilesStore } from '@/stores/filesStore'
import { useMeta } from '@/hooks/useMeta'
import { useProjectsStore } from '@/stores/projectsStore'
import { useI18n } from '@/i18n'
import ConversationTimeline from '../components/ConversationTimeline'
import { MarkManager } from '../utils/data/markManager'
import { SortManager } from '../utils/data/sortManager'
import { StatsCalculator } from '../utils/data/statsCalculator'

class TimelineErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  constructor(props: { children: ReactNode }) { super(props); this.state = { error: null } }
  static getDerivedStateFromError(error: Error) { return { error } }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error('Timeline error:', error, info) }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 24, background: 'var(--bg-secondary)', border: '1px solid var(--accent-danger)', borderRadius: 12, margin: 20 }}>
          <p style={{ color: 'var(--accent-danger)', fontWeight: 600, marginBottom: 8 }}>Failed to render timeline</p>
          <pre style={{ fontSize: 11, color: 'var(--text-tertiary)', overflow: 'auto', maxHeight: 300, whiteSpace: 'pre-wrap' }}>
            {this.state.error.message}{'\n\n'}{this.state.error.stack?.slice(0, 1500)}
          </pre>
        </div>
      )
    }
    return this.props.children
  }
}

function MetaModal({ conversationId, onClose }: { conversationId: string; onClose: () => void }) {
  const { meta, setTags, setStarred, setProject, setAccount, setStatus } = useMeta(conversationId)
  const { projects, accounts } = useProjectsStore()
  const [tagInput, setTagInput] = useState('')

  function addTag() {
    const tag = tagInput.trim()
    if (!tag || meta.tags.includes(tag)) return
    setTags([...meta.tags, tag])
    setTagInput('')
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Conversation Details</h3>
          <button className="file-close-btn" onClick={onClose}>×</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Starred</span>
            <button
              className={`star-btn${meta.starred ? ' starred' : ''}`}
              style={{ width: 'auto', padding: '4px 12px', borderRadius: 'var(--radius-sm)', fontSize: 13, background: 'var(--bg-tertiary)', border: '1px solid var(--border-primary)' }}
              onClick={() => setStarred(!meta.starred)}
            >
              {meta.starred ? '⭐ Starred' : '☆ Star'}
            </button>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>Status</label>
            <input
              type="text"
              style={{ width: '100%', padding: '6px 10px', background: 'var(--bg-primary)', border: '1px solid var(--border-primary)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: 13 }}
              placeholder="e.g. In progress, Done..."
              value={meta.status ?? ''}
              onChange={(e) => setStatus(e.target.value)}
            />
          </div>

          {projects.length > 0 && (
            <div>
              <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>Project</label>
              <select
                style={{ width: '100%', padding: '6px 10px', background: 'var(--bg-primary)', border: '1px solid var(--border-primary)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: 13 }}
                value={String(meta.project_id ?? '')}
                onChange={(e) => setProject(e.target.value ? Number(e.target.value) : null)}
              >
                <option value="">No project</option>
                {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          )}

          {accounts.length > 0 && (
            <div>
              <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>Account</label>
              <select
                style={{ width: '100%', padding: '6px 10px', background: 'var(--bg-primary)', border: '1px solid var(--border-primary)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: 13 }}
                value={String(meta.account_id ?? '')}
                onChange={(e) => setAccount(e.target.value ? Number(e.target.value) : null)}
              >
                <option value="">No account</option>
                {accounts.map((a) => <option key={a.id} value={a.id}>{a.platform} - {a.name}</option>)}
              </select>
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>Tags</label>
            <div style={{ display: 'flex', gap: 6 }}>
              <input
                type="text"
                style={{ flex: 1, padding: '6px 10px', background: 'var(--bg-primary)', border: '1px solid var(--border-primary)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: 13 }}
                placeholder="Add tag..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addTag()}
              />
              <button className="btn-secondary small" onClick={addTag}>Add</button>
            </div>
            {meta.tags.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                {meta.tags.map((tag) => (
                  <span
                    key={tag}
                    style={{ padding: '3px 10px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-primary)', borderRadius: 20, fontSize: 12, color: 'var(--text-secondary)', cursor: 'pointer' }}
                    onClick={() => setTags(meta.tags.filter((t) => t !== tag))}
                    title="Click to remove"
                  >
                    {tag} ×
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export function TimelinePage() {
  const { fileId } = useParams<{ fileId: string }>()
  const navigate = useNavigate()
  const { t } = useI18n()
  const files = useFilesStore((s) => s.files)
  const file = files.find((f) => f.id === fileId)
  const [metaOpen, setMetaOpen] = useState(false)
  const [markVersion, setMarkVersion] = useState(0)
  const [sortVersion, setSortVersion] = useState(0)
  const [branchState, setBranchState] = useState(null)
  const [hideNavbar, setHideNavbar] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const markManagerRef = useRef<InstanceType<typeof MarkManager> | null>(null)
  const sortManagerRef = useRef<InstanceType<typeof SortManager> | null>(null)

  type ParsedFile = {
    chat_history?: unknown[]
    format?: string
    platform?: string
    meta_info?: { title?: string; model?: string }
    [key: string]: unknown
  }
  const parsed = file?.parsed as ParsedFile | null

  useEffect(() => {
    if (!fileId) return
    markManagerRef.current = new MarkManager(fileId)
    setMarkVersion((v) => v + 1)
  }, [fileId])

  useEffect(() => {
    const msgs = parsed?.chat_history ?? []
    if (msgs.length > 0 && fileId) {
      sortManagerRef.current = new SortManager(msgs, fileId)
      setSortVersion((v) => v + 1)
    }
  }, [fileId, parsed])

  const currentMarks = useMemo(
    () => markManagerRef.current?.getMarks() ?? { completed: new Set(), important: new Set(), deleted: new Set() },
    [markVersion]
  )

  const sortedMessages = useMemo(() => {
    const msgs = parsed?.chat_history ?? []
    if (!sortManagerRef.current || msgs.length === 0) return msgs
    const sorted = sortManagerRef.current.getSortedMessages()
    return sorted.length === msgs.length ? sorted : msgs
  }, [parsed, sortVersion])

  const allMarksStats = useMemo(
    () => StatsCalculator.getAllMarksStats(files.map((f) => ({ name: f.name }))),
    [files, markVersion]
  )

  const conversation = useMemo(() => {
    if (!file || !parsed) return null
    return {
      type: 'file',
      uuid: fileId,
      name: parsed.meta_info?.title ?? file.name.replace(/\.json$/, ''),
      originalName: parsed.meta_info?.title ?? file.name.replace(/\.json$/, ''),
      fileName: file.name,
      fileIndex: 0,
      isCurrentFile: true,
      format: parsed.format ?? parsed.platform ?? 'unknown',
      model: parsed.meta_info?.model ?? '',
      messageCount: (parsed.chat_history ?? []).length,
      platform: parsed.platform ?? 'unknown',
    }
  }, [file, parsed, fileId])

  const stats = useMemo(() => ({
    totalMessages: sortedMessages.length,
    markedCount: allMarksStats.total,
    fileCount: files.length,
  }), [sortedMessages, allMarksStats, files])

  const markActions = useMemo(() => ({
    toggleMark: (messageIndex: number, markType: string) => {
      markManagerRef.current?.toggleMark(messageIndex, markType)
      setMarkVersion((v) => v + 1)
    },
    isMarked: (messageIndex: number, markType: string) =>
      markManagerRef.current?.isMarked(messageIndex, markType) ?? false,
    clearAllMarks: () => { markManagerRef.current?.clearAllMarks(); setMarkVersion((v) => v + 1) },
    getMarks: () => markManagerRef.current?.getMarks() ?? { completed: new Set(), important: new Set(), deleted: new Set() },
  }), [])

  const sortActions = useMemo(() => ({
    moveMessageUp: (index: number) => { sortManagerRef.current?.moveMessage(index, 'up'); setSortVersion((v) => v + 1) },
    moveMessageDown: (index: number) => { sortManagerRef.current?.moveMessage(index, 'down'); setSortVersion((v) => v + 1) },
    resetSort: () => { sortManagerRef.current?.resetSort(); setSortVersion((v) => v + 1) },
  }), [])

  if (!file) {
    navigate('/')
    return null
  }

  return (
    <div className="app-redesigned">
      {/* Navbar */}
      {!hideNavbar && (
        <nav className="navbar-redesigned">
          <div className="navbar-left">
            <div className="logo">
              <span style={{ fontSize: 16, fontWeight: 700, background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', letterSpacing: 2 }}>LYRA</span>
            </div>
            <button className="btn-secondary small" onClick={() => navigate('/list')}>
              ← {t('app.navbar.backToList') || 'Back'}
            </button>
            {/* Search */}
            <input
              type="text"
              placeholder={t('app.search.placeholder') || 'Search messages...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                flex: 1, maxWidth: 400, padding: '4px 12px',
                background: 'var(--bg-primary)', border: '1px solid var(--border-primary)',
                borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: 13, outline: 'none',
              }}
            />
          </div>
          <div className="navbar-right">
            <button className="btn-secondary small" onClick={() => setMetaOpen(true)}>
              ✦ Details
            </button>
          </div>
        </nav>
      )}

      {/* Main container */}
      <div className="main-container">
        <div className="content-area">
          {/* Stats panel */}
          <div className="stats-panel">
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-value">{stats.totalMessages}</div>
                <div className="stat-label">{t('app.stats.totalMessages') || 'Messages'}</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{stats.fileCount}</div>
                <div className="stat-label">{t('app.stats.fileCount') || 'Files loaded'}</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{stats.markedCount}</div>
                <div className="stat-label">{t('app.stats.markedCount') || 'Marked'}</div>
              </div>
              <div className="stat-card">
                <div className="stat-value" style={{ fontSize: 18 }}>
                  {conversation?.format ?? '–'}
                </div>
                <div className="stat-label">Format</div>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="view-content">
            {parsed ? (
              <TimelineErrorBoundary>
                <ConversationTimeline
                  data={parsed as any}
                  conversation={conversation as any}
                  messages={sortedMessages as any}
                  marks={currentMarks as any}
                  markActions={markActions as any}
                  format={parsed.format ?? parsed.platform ?? 'unknown'}
                  sortActions={sortActions as any}
                  hasCustomSort={sortManagerRef.current?.hasCustomSort() ?? false}
                  enableSorting={true}
                  files={[file] as any}
                  currentFileIndex={0 as any}
                  searchQuery={searchQuery}
                  branchState={branchState as any}
                  onBranchStateChange={setBranchState as any}
                  onHideNavbar={setHideNavbar as any}
                />
              </TimelineErrorBoundary>
            ) : (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-tertiary)' }}>
                Could not parse this file.
              </div>
            )}
          </div>
        </div>
      </div>

      {metaOpen && <MetaModal conversationId={fileId ?? ''} onClose={() => setMetaOpen(false)} />}
    </div>
  )
}
