import { useRef, useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFiles } from '@/hooks/useFiles'
import { useFilesStore } from '@/stores/filesStore'
import { useMetaStore } from '@/stores/metaStore'
import { useI18n } from '@/i18n'
import { deleteCachedFile } from '@/lib/storage'
import { StatsCalculator } from '../utils/data/statsCalculator'
import { getRenameManager } from '../utils/renameManager'
import { generateFileCardUuid } from '../utils/data/uuidManager'

import { Card as UnifiedCard } from '../components/UnifiedCard'
import FullExportCardFilter from '../components/FullExportCardFilter'
import FloatingActionButton from '../components/FloatingActionButton'

const ORDER_KEY = 'lyra:card-order'
function loadOrder(): string[] {
  try { return JSON.parse(localStorage.getItem(ORDER_KEY) ?? '[]') } catch { return [] }
}
function saveOrder(ids: string[]) {
  localStorage.setItem(ORDER_KEY, JSON.stringify(ids))
}

type ParsedFile = {
  format?: string; platform?: string
  meta_info?: { title?: string; model?: string; created_at?: string; project?: string; project_uuid?: string; organization_id?: string }
  chat_history?: unknown[]; branches?: unknown[]; uuid?: string
}

export function ListPage() {
  const navigate = useNavigate()
  const { t } = useI18n()
  const { files, loadFromFileObjects, removeFile } = useFiles()
  const renameFileInStore = useFilesStore((s) => s.renameFile)
  const starredMap = useMetaStore((s) => s.meta)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const folderInputRef = useRef<HTMLInputElement>(null)

  const [order, setOrder] = useState<string[]>(loadOrder)
  const [filters, setFilters] = useState({
    name: '', dateRange: 'all', project: 'all',
    organization: 'all', starred: 'all', operated: 'all'
  })
  const [sortField, setSortField] = useState('created_at')
  const [sortOrder, setSortOrder] = useState('desc')

  const renameManager = useMemo(() => getRenameManager(), [])

  // Build allCards from our LoadedFile store — matches UnifiedCard's expected shape
  const allCards = useMemo(() => {
    const cards = files.map((file, fileIndex) => {
      const parsed = file.parsed as ParsedFile | undefined
      const meta_info = parsed?.meta_info ?? {}
      const chat_history = parsed?.chat_history ?? []
      const format = parsed?.format ?? parsed?.platform ?? 'unknown'
      const messageCount = chat_history.length
      const fileUuid = generateFileCardUuid(fileIndex, { name: file.name, size: 0, lastModified: file.loadedAt })
      const originalName = meta_info.title ? meta_info.title.replace('.json', '') : file.name.replace('.json', '')
      const displayName = renameManager.getRename(fileUuid, originalName)

      return {
        type: 'file',
        uuid: fileUuid,
        _fileId: file.id,        // keep our store id for navigation
        name: displayName,
        originalName,
        fileName: file.name,
        fileIndex,
        isCurrentFile: false,
        format,
        model: meta_info.model ?? '',
        messageCount,
        conversationCount: 1,
        created_at: meta_info.created_at ?? null,
        platform: parsed?.platform ?? file.platform ?? 'unknown',
        summary: format !== 'unknown'
          ? t('fileCard.messageSummary', { count: messageCount })
          : t('fileCard.clickToLoad'),
        size: 0,
        project: meta_info.project ?? null,
        project_uuid: meta_info.project_uuid ?? null,
        organization_id: meta_info.organization_id ?? null,
        is_starred: starredMap[fileUuid]?.starred ?? false,
      }
    })

    // Apply manual sort order
    if (order.length > 0) {
      const pos = new Map(order.map((id, i) => [id, i]))
      cards.sort((a, b) => (pos.get(a._fileId) ?? Infinity) - (pos.get(b._fileId) ?? Infinity))
    }

    // Apply sort field
    return [...cards].sort((a, b) => {
      let cmp = 0
      if (sortField === 'created_at') {
        const ta = a.created_at ? new Date(a.created_at).getTime() : 0
        const tb = b.created_at ? new Date(b.created_at).getTime() : 0
        cmp = ta - tb
      } else if (sortField === 'name') {
        cmp = (a.name || '').localeCompare(b.name || '')
      } else if (sortField === 'messageCount') {
        cmp = (a.messageCount || 0) - (b.messageCount || 0)
      } else if (sortField === 'size') {
        cmp = (a.size || 0) - (b.size || 0)
      }
      return sortOrder === 'asc' ? cmp : -cmp
    })
  }, [files, order, sortField, sortOrder, starredMap, renameManager, t])

  // Apply text/date/project filters
  const filteredCards = useMemo(() => {
    return allCards.filter((card) => {
      if (filters.name.trim() && !card.name.toLowerCase().includes(filters.name.toLowerCase())) return false
      if (filters.starred !== 'all') {
        if (filters.starred === 'starred' && !card.is_starred) return false
        if (filters.starred === 'unstarred' && card.is_starred) return false
      }
      return true
    })
  }, [allCards, filters])

  // Stats — use original StatsCalculator
  const stats = useMemo(() => ({
    totalMessages: allCards.reduce((s, c) => s + (c.messageCount || 0), 0),
    conversationCount: allCards.length,
    fileCount: files.length,
    markedCount: 0,
    starredCount: allCards.filter((c) => c.is_starred).length,
  }), [allCards, files.length])

  const filterStats = useMemo(() => ({
    total: allCards.length,
    filtered: filteredCards.length,
    hasActiveFilters: filteredCards.length !== allCards.length,
    activeFilterCount: Object.values(filters).filter((v) => v !== 'all' && v !== '').length,
  }), [allCards.length, filteredCards.length, filters])

  async function handleFiles(fileList: FileList | null) {
    if (!fileList) return
    const jsonFiles = Array.from(fileList).filter((f) => f.name.endsWith('.json'))
    if (!jsonFiles.length) return
    await loadFromFileObjects(jsonFiles)
  }

  const handleRemove = useCallback(async (fileId: string | number) => {
    const file = files.find((f, i) => i === fileId || f.id === String(fileId))
    if (file) await deleteCachedFile(file.name).catch(() => {})
    const card = allCards[typeof fileId === 'number' ? fileId : 0]
    removeFile(card?._fileId ?? String(fileId))
  }, [files, allCards, removeFile])

  const handleSelect = useCallback((item: { _fileId?: string; fileIndex?: number }) => {
    const fileId = item._fileId ?? files[item.fileIndex ?? 0]?.id
    if (fileId) navigate(`/timeline/${fileId}`)
  }, [files, navigate])

  const handleStar = useCallback((uuid: string, isStarred: boolean) => {
    // toggleStar via metaStore
    useMetaStore.getState().update(uuid, { starred: !isStarred })
  }, [])

  const handleRename = useCallback((uuid: string, newName: string) => {
    renameManager.setRename(uuid, newName)
    const card = allCards.find((c) => c.uuid === uuid)
    if (card) renameFileInStore?.(card._fileId, newName)
  }, [allCards, renameManager, renameFileInStore])

  const handleFilterChange = useCallback((key: string, value: string) => {
    setFilters((f) => ({ ...f, [key]: value }))
  }, [])

  const handleSortChange = useCallback((field: string, ord: string) => {
    setSortField(field)
    setSortOrder(ord)
  }, [])

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Stats bar */}
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
            <div className="stat-value">{stats.fileCount}</div>
            <div className="stat-label">{t('app.stats.fileCount')}</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.markedCount}</div>
            <div className="stat-label">{t('app.stats.markedCount')}</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.starredCount}</div>
            <div className="stat-label">{t('app.stats.starredCount')}</div>
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <FullExportCardFilter
        filters={filters}
        availableProjects={[]}
        availableOrganizations={[]}
        filterStats={filterStats}
        onFilterChange={handleFilterChange}
        onReset={() => setFilters({ name: '', dateRange: 'all', project: 'all', organization: 'all', starred: 'all', operated: 'all' })}
        sortField={sortField}
        sortOrder={sortOrder}
        onSortChange={handleSortChange}
        onClearAllMarks={() => {}}
        onExportProject={() => {}}
        onImportProject={() => {}}
        onRestoreStars={() => {}}
      />

      {/* Card grid */}
      {files.length === 0 ? (
        <div
          className="flex-1 flex flex-col items-center justify-center gap-3"
          style={{ color: 'var(--text-tertiary)' }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files) }}
        >
          <div style={{ fontSize: 48, opacity: 0.2 }}>◆</div>
          <p className="m-0 text-sm">Drop JSON files here or click the button below.</p>
        </div>
      ) : (
        <div className="conversations-grid">
          {filteredCards.map((card) => (
            <UnifiedCard
              key={card.uuid}
              item={card}
              isSelected={false}
              isStarred={card.is_starred}
              onSelect={handleSelect}
              onStar={handleStar}
              onRemove={handleRemove}
              onRename={handleRename}
            />
          ))}
        </div>
      )}

      <FloatingActionButton
        onClick={() => fileInputRef.current?.click()}
        title={t('app.addFile') || 'Add file'}
      />

      <input ref={fileInputRef} type="file" accept=".json" multiple hidden
        onChange={(e) => handleFiles(e.target.files)} />
      <input ref={folderInputRef} type="file" accept=".json" multiple hidden
        {...{ webkitdirectory: '', directory: '' } as React.InputHTMLAttributes<HTMLInputElement>}
        onChange={(e) => handleFiles(e.target.files)} />
    </div>
  )
}
