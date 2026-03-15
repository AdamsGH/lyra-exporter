import { useState, useMemo, useRef, useEffect, Component, type ReactNode, type ErrorInfo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Star, Tag, FolderKanban } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useFilesStore } from '@/stores/filesStore'
import { useMeta } from '@/hooks/useMeta'
import { useProjectsStore } from '@/stores/projectsStore'
import { useI18n } from '@/i18n'
import ConversationTimeline from '../components/ConversationTimeline'
import { MarkManager } from '../utils/data/markManager'
import { SortManager } from '../utils/data/sortManager'
import { StatsCalculator } from '../utils/data/statsCalculator'
import { cn } from '@/lib/utils'

class TimelineErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { error: null }
  }
  static getDerivedStateFromError(error: Error) { return { error } }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error('Timeline error:', error, info) }
  render() {
    if (this.state.error) {
      return (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6">
          <p className="text-sm font-medium text-destructive mb-2">Failed to render timeline</p>
          <pre className="text-xs text-muted-foreground overflow-auto max-h-64 whitespace-pre-wrap">
            {this.state.error.message}{'\n\n'}{this.state.error.stack?.slice(0, 1000)}
          </pre>
        </div>
      )
    }
    return this.props.children
  }
}

interface MetaDialogProps {
  isOpen: boolean
  onClose: () => void
  conversationId: string
}

function MetaDialog({ isOpen, onClose, conversationId }: MetaDialogProps) {
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
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Conversation details</DialogTitle></DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Starred</span>
            <Button variant={meta.starred ? 'secondary' : 'outline'} size="sm" onClick={() => setStarred(!meta.starred)}>
              <Star className={cn('h-4 w-4', meta.starred && 'fill-yellow-400 text-yellow-400')} />
              {meta.starred ? 'Starred' : 'Star'}
            </Button>
          </div>
          <div className="grid gap-1.5">
            <span className="text-sm font-medium">Status</span>
            <Input placeholder="e.g. In progress, Done..." value={meta.status ?? ''} onChange={(e) => setStatus(e.target.value)} />
          </div>
          {projects.length > 0 && (
            <div className="grid gap-1.5">
              <span className="text-sm font-medium">Project</span>
              <Select value={String(meta.project_id ?? '')} onValueChange={(v) => setProject(v ? Number(v) : null)}>
                <SelectTrigger><SelectValue placeholder="No project" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No project</SelectItem>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      <span className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full inline-block" style={{ background: p.color }} />
                        {p.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {accounts.length > 0 && (
            <div className="grid gap-1.5">
              <span className="text-sm font-medium">Account</span>
              <Select value={String(meta.account_id ?? '')} onValueChange={(v) => setAccount(v ? Number(v) : null)}>
                <SelectTrigger><SelectValue placeholder="No account" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No account</SelectItem>
                  {accounts.map((a) => (
                    <SelectItem key={a.id} value={String(a.id)}>{a.platform} - {a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="grid gap-1.5">
            <span className="text-sm font-medium">Tags</span>
            <div className="flex gap-2">
              <Input placeholder="Add tag..." value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addTag()} />
              <Button variant="outline" size="sm" onClick={addTag}>Add</Button>
            </div>
            {meta.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-1">
                {meta.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1 cursor-pointer" onClick={() => setTags(meta.tags.filter((t) => t !== tag))}>
                    <Tag className="h-3 w-3" /> {tag} ×
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
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
  const markManagerRef = useRef<InstanceType<typeof MarkManager> | null>(null)
  const sortManagerRef = useRef<InstanceType<typeof SortManager> | null>(null)

  const parsed = file?.parsed as {
    chat_history?: unknown[]
    format?: string
    platform?: string
    meta_info?: { title?: string; model?: string }
    [key: string]: unknown
  } | null

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

  const currentMarks = useMemo(() => {
    return markManagerRef.current?.getMarks() ?? { completed: new Set(), important: new Set(), deleted: new Set() }
  }, [markVersion])

  const sortedMessages = useMemo(() => {
    const msgs = parsed?.chat_history ?? []
    if (!sortManagerRef.current || msgs.length === 0) return msgs
    const sorted = sortManagerRef.current.getSortedMessages()
    return sorted.length === msgs.length ? sorted : msgs
  }, [parsed, sortVersion])

  const allMarksStats = useMemo(() => {
    return StatsCalculator.getAllMarksStats(files.map((f) => ({ name: f.name })))
  }, [files, markVersion])

  const stats = useMemo(() => {
    return StatsCalculator.calculateTimelineStats(
      sortedMessages, sortedMessages, files, allMarksStats, false, conversation
    )
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortedMessages, files, allMarksStats])

  const markActions = useMemo(() => ({
    toggleMark: (messageIndex: number, markType: string) => {
      markManagerRef.current?.toggleMark(messageIndex, markType)
      setMarkVersion((v) => v + 1)
    },
    isMarked: (messageIndex: number, markType: string) =>
      markManagerRef.current?.isMarked(messageIndex, markType) ?? false,
    clearAllMarks: () => {
      markManagerRef.current?.clearAllMarks()
      setMarkVersion((v) => v + 1)
    },
    getMarks: () => markManagerRef.current?.getMarks() ?? { completed: new Set(), important: new Set(), deleted: new Set() },
  }), [])

  const sortActions = useMemo(() => ({
    moveMessageUp: (index: number) => {
      sortManagerRef.current?.moveMessage(index, 'up')
      setSortVersion((v) => v + 1)
    },
    moveMessageDown: (index: number) => {
      sortManagerRef.current?.moveMessage(index, 'down')
      setSortVersion((v) => v + 1)
    },
    resetSort: () => {
      sortManagerRef.current?.resetSort()
      setSortVersion((v) => v + 1)
    },
  }), [])

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

  if (!file) {
    navigate('/')
    return null
  }

  return (
    <div className="app-container" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {!hideNavbar && (
        <nav className="app-navbar">
          <div className="navbar-left">
            <button className="btn-secondary small" onClick={() => navigate('/list')}>
              ← Back
            </button>
            <div className="logo">
              <span className="logo-text">{conversation?.name ?? file.name}</span>
            </div>
          </div>
          <div className="navbar-right">
            <button className="btn-secondary small" onClick={() => setMetaOpen(true)}>
              ✦ Details
            </button>
          </div>
        </nav>
      )}

      <div className="main-container">
        <div className="content-area">
          {/* Stats panel — same classes as original */}
          <div className="stats-panel">
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-value">{stats.totalMessages}</div>
                <div className="stat-label">{t('app.stats.totalMessages')}</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{stats.conversationCount}</div>
                <div className="stat-label">{t('app.stats.conversationCount')}</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{files.length}</div>
                <div className="stat-label">{t('app.stats.fileCount')}</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{allMarksStats.total}</div>
                <div className="stat-label">{t('app.stats.markedCount')}</div>
              </div>
            </div>
          </div>

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
                  searchQuery=""
                  branchState={branchState as any}
                  onBranchStateChange={setBranchState as any}
                  onHideNavbar={setHideNavbar as any}
                />
              </TimelineErrorBoundary>
            ) : (
              <div className="empty-state">
                <p>Could not parse this file format.</p>
                <pre style={{ fontSize: 11, maxHeight: 400, overflow: 'auto' }}>
                  {JSON.stringify(file.raw, null, 2).slice(0, 3000)}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>

      <MetaDialog isOpen={metaOpen} onClose={() => setMetaOpen(false)} conversationId={fileId ?? ''} />
    </div>
  )
}
