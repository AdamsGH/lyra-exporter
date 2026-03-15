import { useState, useMemo, Component, type ReactNode, type ErrorInfo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Star, Tag, FolderKanban } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { useFilesStore } from '@/stores/filesStore'
import { useMeta } from '@/hooks/useMeta'
import { useProjectsStore } from '@/stores/projectsStore'
import ConversationTimeline from '../components/ConversationTimeline'
import { MarkManager } from '../utils/data/markManager'
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
            {this.state.error.message}
            {'\n\n'}
            {this.state.error.stack?.slice(0, 1000)}
          </pre>
        </div>
      )
    }
    return this.props.children
  }
}

function useMarkManager(fileId: string) {
  const [, forceUpdate] = useState(0)
  const managerRef = useState(() => new MarkManager(fileId))[0]

  const markActions = useMemo(() => ({
    toggleMark: (messageIndex: number, markType: string) => {
      managerRef.toggleMark(messageIndex, markType)
      forceUpdate((v) => v + 1)
    },
    isMarked: (messageIndex: number, markType: string) => managerRef.isMarked(messageIndex, markType),
    clearAllMarks: () => { managerRef.clearAllMarks?.(); forceUpdate((v) => v + 1) },
    getMarks: () => managerRef.getMarks(),
  }), [managerRef])

  const marks = managerRef.getMarks()
  return { marks, markActions }
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

  function removeTag(tag: string) {
    setTags(meta.tags.filter((t) => t !== tag))
  }

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Conversation details</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Starred</span>
            <Button
              variant={meta.starred ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => setStarred(!meta.starred)}
            >
              <Star className={cn('h-4 w-4', meta.starred && 'fill-yellow-400 text-yellow-400')} />
              {meta.starred ? 'Starred' : 'Star'}
            </Button>
          </div>

          <div className="grid gap-1.5">
            <span className="text-sm font-medium">Status</span>
            <Input
              placeholder="e.g. In progress, Done..."
              value={meta.status ?? ''}
              onChange={(e) => setStatus(e.target.value)}
            />
          </div>

          {projects.length > 0 && (
            <div className="grid gap-1.5">
              <span className="text-sm font-medium">Project</span>
              <Select
                value={String(meta.project_id ?? '')}
                onValueChange={(v) => setProject(v ? Number(v) : null)}
              >
                <SelectTrigger><SelectValue placeholder="No project" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No project</SelectItem>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      <span className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
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
              <Select
                value={String(meta.account_id ?? '')}
                onValueChange={(v) => setAccount(v ? Number(v) : null)}
              >
                <SelectTrigger><SelectValue placeholder="No account" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No account</SelectItem>
                  {accounts.map((a) => (
                    <SelectItem key={a.id} value={String(a.id)}>
                      {a.platform} - {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid gap-1.5">
            <span className="text-sm font-medium">Tags</span>
            <div className="flex gap-2">
              <Input
                placeholder="Add tag..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addTag()}
              />
              <Button variant="outline" size="sm" onClick={addTag}>Add</Button>
            </div>
            {meta.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-1">
                {meta.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1 cursor-pointer" onClick={() => removeTag(tag)}>
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
  const file = useFilesStore((s) => s.files.find((f) => f.id === fileId))
  const [metaOpen, setMetaOpen] = useState(false)
  const { marks, markActions } = useMarkManager(fileId ?? '')

  if (!file) {
    navigate('/')
    return null
  }

  const parsed = file.parsed as {
    chat_history?: unknown[]
    format?: string
    platform?: string
    [key: string]: unknown
  } | null

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => navigate('/list')}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <span className="text-sm font-medium flex-1 truncate">{file.name}</span>
        <Button variant="outline" size="sm" onClick={() => setMetaOpen(true)}>
          <FolderKanban className="h-4 w-4" /> Details
        </Button>
      </div>

      {parsed ? (
        <TimelineErrorBoundary>
          <ConversationTimeline
            data={parsed}
            messages={parsed.chat_history ?? []}
            marks={marks}
            markActions={markActions}
            format={parsed.format ?? parsed.platform ?? 'unknown'}
          />
        </TimelineErrorBoundary>
      ) : (
        <div className="rounded-lg border border-border p-6 text-center text-muted-foreground text-sm">
          Could not parse this file format.
          <pre className="mt-4 text-xs text-left overflow-auto max-h-96">
            {JSON.stringify(file.raw, null, 2).slice(0, 3000)}
          </pre>
        </div>
      )}

      <MetaDialog
        isOpen={metaOpen}
        onClose={() => setMetaOpen(false)}
        conversationId={fileId ?? ''}
      />
    </div>
  )
}
