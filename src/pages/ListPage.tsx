import { useRef, useState, useMemo, useCallback } from 'react'
import { useFiles } from '@/hooks/useFiles'
import { useFilesStore } from '@/stores/filesStore'
import { useMetaStore } from '@/stores/metaStore'
import { useProjectsStore } from '@/stores/projectsStore'
import { ConversationGrid } from '@/components/ConversationGrid'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { deleteCachedFile } from '@/lib/storage'
import type { LoadedFile } from '@/stores/filesStore'
import type { CardData } from '@/hooks/useCardData'

const ORDER_KEY = 'lyra:card-order'

function loadOrder(): string[] {
  try { return JSON.parse(localStorage.getItem(ORDER_KEY) ?? '[]') } catch { return [] }
}
function saveOrder(ids: string[]) {
  localStorage.setItem(ORDER_KEY, JSON.stringify(ids))
}

type ParsedFile = {
  format?: string
  platform?: string
  meta_info?: { title?: string; model?: string; created_at?: string }
  chat_history?: unknown[]
  branches?: unknown[]
  uuid?: string
}

function fileToCardData(
  file: LoadedFile,
  metaMap: Record<string, { starred?: boolean; tags?: string[]; project_id?: number | null }>,
  projects: { id: number; name: string; color: string }[]
): CardData {
  const parsed = file.parsed as ParsedFile | undefined
  const meta_info = parsed?.meta_info ?? {}
  const conversationId = parsed?.uuid ?? meta_info.title ?? file.id
  const meta = metaMap[conversationId]
  const projectId = meta?.project_id ?? null
  const project = projectId ? projects.find((p) => p.id === projectId) ?? null : null

  return {
    conversationId,
    fileId: file.id,
    title: file.name.replace(/\.json$/, ''),
    platform: parsed?.platform ?? file.platform ?? 'unknown',
    format: parsed?.format ?? file.platform ?? 'unknown',
    model: meta_info.model ?? '',
    createdAt: meta_info.created_at ?? null,
    messageCount: (parsed?.chat_history ?? []).length,
    branchCount: (parsed?.branches ?? []).length,
    starred: meta?.starred ?? false,
    tags: meta?.tags ?? [],
    projectId,
    projectName: project?.name ?? null,
    projectColor: project?.color ?? null,
  }
}

export function ListPage() {
  const { files, loadFromFileObjects, removeFile } = useFiles()
  const renameFile = useFilesStore((s) => s.renameFile)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const folderInputRef = useRef<HTMLInputElement>(null)

  const [search, setSearch] = useState('')
  const [platformFilter, setPlatformFilter] = useState('all')
  const [tagFilter, setTagFilter] = useState('')
  const [order, setOrder] = useState<string[]>(loadOrder)

  const metaMap = useMetaStore((s) => s.meta) as Record<string, { starred?: boolean; tags?: string[]; project_id?: number | null }>
  const projects = useProjectsStore((s) => s.projects) as { id: number; name: string; color: string }[]

  const allCardData = useMemo(
    () => files.map((f) => fileToCardData(f, metaMap, projects)),
    [files, metaMap, projects]
  )

  const platforms = useMemo(
    () => [...new Set(allCardData.map((c) => c.platform).filter((p) => p !== 'unknown'))],
    [allCardData]
  )

  const allTags = useMemo(
    () => [...new Set(allCardData.flatMap((c) => c.tags))].sort(),
    [allCardData]
  )

  // Apply sort order, then filters
  const sorted = useMemo(() => {
    if (order.length === 0) return allCardData
    const pos = new Map(order.map((id, i) => [id, i]))
    return [...allCardData].sort((a, b) => {
      const ai = pos.get(a.fileId) ?? Infinity
      const bi = pos.get(b.fileId) ?? Infinity
      return ai - bi
    })
  }, [allCardData, order])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return sorted.filter((c) => {
      if (q && !c.title.toLowerCase().includes(q)) return false
      if (platformFilter !== 'all' && c.platform !== platformFilter) return false
      if (tagFilter && !c.tags.includes(tagFilter)) return false
      return true
    })
  }, [sorted, search, platformFilter, tagFilter])

  async function handleFiles(fileList: FileList | null) {
    if (!fileList) return
    const jsonFiles = Array.from(fileList).filter((f) => f.name.endsWith('.json'))
    if (jsonFiles.length === 0) return
    await loadFromFileObjects(jsonFiles)
  }

  const handleRemove = useCallback(async (fileId: string) => {
    const file = files.find((f) => f.id === fileId)
    if (file) await deleteCachedFile(file.name).catch(() => {})
    removeFile(fileId)
  }, [files, removeFile])

  const handleReorder = useCallback((ids: string[]) => {
    setOrder(ids)
    saveOrder(ids)
  }, [])

  const handleRenameConfirm = useCallback((fileId: string, name: string) => {
    renameFile?.(fileId, name)
  }, [renameFile])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, height: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>
          Conversations
          <span style={{ marginLeft: 8, fontSize: 14, fontWeight: 400, color: 'var(--text-tertiary)' }}>
            {filtered.length}{filtered.length !== files.length ? ` / ${files.length}` : ''}
          </span>
        </h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-secondary small" onClick={() => fileInputRef.current?.click()}>
            + File
          </button>
          <button className="btn-secondary small" onClick={() => folderInputRef.current?.click()}>
            + Folder
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <Input
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 260, height: 32, fontSize: 13 }}
        />

        {platforms.length > 1 && (
          <Select value={platformFilter} onValueChange={setPlatformFilter}>
            <SelectTrigger style={{ width: 140, height: 32, fontSize: 13 }}>
              <SelectValue placeholder="Platform" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All platforms</SelectItem>
              {platforms.map((p) => (
                <SelectItem key={p} value={p}>
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {allTags.length > 0 && (
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {allTags.map((tag) => (
              <Badge
                key={tag}
                variant={tagFilter === tag ? 'default' : 'secondary'}
                style={{ cursor: 'pointer', fontSize: 11 }}
                onClick={() => setTagFilter(tagFilter === tag ? '' : tag)}
              >
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Grid */}
      {files.length === 0 ? (
        <div
          style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', flexDirection: 'column', gap: 12 }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files) }}
        >
          <div style={{ fontSize: 40, opacity: 0.3 }}>◆</div>
          <p style={{ margin: 0 }}>No files loaded. Drop JSON files here or click + File.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)' }}>
          No conversations match the current filters.
        </div>
      ) : (
        <ConversationGrid
          items={filtered}
          onRemove={handleRemove}
          onReorder={handleReorder}
          onRenameConfirm={handleRenameConfirm}
        />
      )}

      <input ref={fileInputRef} type="file" accept=".json" multiple hidden
        onChange={(e) => handleFiles(e.target.files)} />
      <input ref={folderInputRef} type="file" accept=".json" multiple hidden
        {...{ webkitdirectory: '', directory: '' } as React.InputHTMLAttributes<HTMLInputElement>}
        onChange={(e) => handleFiles(e.target.files)} />
    </div>
  )
}
