import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Star, Tag, Search, SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useFilesStore } from '@/stores/filesStore'
import { useMetaStore } from '@/stores/metaStore'
import { useProjectsStore } from '@/stores/projectsStore'
import { cn } from '@/lib/utils'

interface ParsedData {
  title?: string
  platform?: string
  chat_history?: unknown[]
  [key: string]: unknown
}

interface ConversationEntry {
  fileId: string
  fileName: string
  conversationId: string
  title: string
  platform: string
  messageCount: number
  loadedAt: number
}

const PLATFORM_COLORS: Record<string, string> = {
  claude: 'bg-orange-500/15 text-orange-400 border-orange-500/20',
  chatgpt: 'bg-green-500/15 text-green-400 border-green-500/20',
  gemini: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  grok: 'bg-purple-500/15 text-purple-400 border-purple-500/20',
  copilot: 'bg-sky-500/15 text-sky-400 border-sky-500/20',
  claude_code: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
}

function platformBadge(platform: string) {
  return PLATFORM_COLORS[platform] ?? 'bg-muted text-muted-foreground border-border'
}

export function ListPage() {
  const navigate = useNavigate()
  const files = useFilesStore((s) => s.files)
  const { meta } = useMetaStore()
  const { projects } = useProjectsStore()

  const [search, setSearch] = useState('')
  const [filterStarred, setFilterStarred] = useState(false)
  const [filterProjectId, setFilterProjectId] = useState<number | null>(null)
  const [filterPlatform, setFilterPlatform] = useState<string | null>(null)

  const conversations: ConversationEntry[] = useMemo(() => {
    const result: ConversationEntry[] = []
    for (const file of files) {
      const parsed = file.parsed as ParsedData | null
      if (!parsed) {
        result.push({
          fileId: file.id,
          fileName: file.name,
          conversationId: file.id,
          title: file.name.replace(/\.json$/, ''),
          platform: file.platform ?? 'unknown',
          messageCount: 0,
          loadedAt: file.loadedAt,
        })
        continue
      }
      result.push({
        fileId: file.id,
        fileName: file.name,
        conversationId: file.id,
        title: parsed.title || file.name.replace(/\.json$/, ''),
        platform: parsed.platform ?? file.platform ?? 'unknown',
        messageCount: Array.isArray(parsed.chat_history) ? parsed.chat_history.length : 0,
        loadedAt: file.loadedAt,
      })
    }
    return result
  }, [files])

  const filtered = useMemo(() => {
    return conversations.filter((c) => {
      const m = meta[c.conversationId]
      if (filterStarred && !m?.starred) return false
      if (filterProjectId && m?.project_id !== filterProjectId) return false
      if (filterPlatform && c.platform !== filterPlatform) return false
      if (search) {
        const q = search.toLowerCase()
        const inTitle = c.title.toLowerCase().includes(q)
        const inTags = m?.tags?.some((t) => t.toLowerCase().includes(q))
        if (!inTitle && !inTags) return false
      }
      return true
    })
  }, [conversations, meta, filterStarred, filterProjectId, filterPlatform, search])

  const platforms = useMemo(() => [...new Set(conversations.map((c) => c.platform))], [conversations])

  if (files.length === 0) {
    navigate('/')
    return null
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            className="pl-8"
            placeholder="Search conversations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <Button
          variant={filterStarred ? 'secondary' : 'outline'}
          size="sm"
          onClick={() => setFilterStarred((v) => !v)}
        >
          <Star className={cn('h-4 w-4', filterStarred && 'fill-current text-yellow-400')} />
          Starred
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <SlidersHorizontal className="h-4 w-4" /> Filter
              {(filterProjectId || filterPlatform) && (
                <span className="ml-1 h-1.5 w-1.5 rounded-full bg-primary" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            {projects.length > 0 && (
              <>
                <DropdownMenuLabel>Project</DropdownMenuLabel>
                <DropdownMenuCheckboxItem
                  checked={filterProjectId === null}
                  onCheckedChange={() => setFilterProjectId(null)}
                >
                  All projects
                </DropdownMenuCheckboxItem>
                {projects.map((p) => (
                  <DropdownMenuCheckboxItem
                    key={p.id}
                    checked={filterProjectId === p.id}
                    onCheckedChange={() => setFilterProjectId(filterProjectId === p.id ? null : p.id)}
                  >
                    <span className="h-2 w-2 rounded-full mr-1.5 inline-block" style={{ background: p.color }} />
                    {p.name}
                  </DropdownMenuCheckboxItem>
                ))}
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuLabel>Platform</DropdownMenuLabel>
            <DropdownMenuCheckboxItem
              checked={filterPlatform === null}
              onCheckedChange={() => setFilterPlatform(null)}
            >
              All platforms
            </DropdownMenuCheckboxItem>
            {platforms.map((p) => (
              <DropdownMenuCheckboxItem
                key={p}
                checked={filterPlatform === p}
                onCheckedChange={() => setFilterPlatform(filterPlatform === p ? null : p)}
              >
                {p}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="text-xs text-muted-foreground">
        {filtered.length} of {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
      </div>

      <div className="grid gap-2">
        {filtered.map((c) => {
          const m = meta[c.conversationId]
          const project = m?.project_id ? projects.find((p) => p.id === m.project_id) : null
          return (
            <div
              key={c.conversationId}
              className="group flex items-start gap-3 rounded-lg border border-border bg-card px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => navigate(`/timeline/${c.fileId}`)}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium truncate">{c.title}</span>
                  {m?.starred && <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400 shrink-0" />}
                </div>

                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <Badge variant="outline" className={cn('text-xs h-5 px-1.5', platformBadge(c.platform))}>
                    {c.platform}
                  </Badge>
                  {c.messageCount > 0 && (
                    <span className="text-xs text-muted-foreground">{c.messageCount} messages</span>
                  )}
                  {project && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: project.color }} />
                      {project.name}
                    </span>
                  )}
                  {m?.status && (
                    <Badge variant="secondary" className="text-xs h-5 px-1.5">{m.status}</Badge>
                  )}
                  {m?.tags?.map((tag) => (
                    <span key={tag} className="flex items-center gap-0.5 text-xs text-muted-foreground">
                      <Tag className="h-3 w-3" />{tag}
                    </span>
                  ))}
                </div>
              </div>

              <span className="text-xs text-muted-foreground shrink-0 pt-0.5">
                {new Date(c.loadedAt).toLocaleTimeString()}
              </span>
            </div>
          )
        })}

        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-12">
            No conversations match your filters.
          </p>
        )}
      </div>
    </div>
  )
}
