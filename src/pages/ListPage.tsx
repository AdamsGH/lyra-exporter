import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFiles } from '@/hooks/useFiles'
import { useFilesStore } from '@/stores/filesStore'
import { useI18n } from '@/i18n'
import { deleteCachedFile } from '@/lib/storage'
import { Card as UnifiedCard } from '../components/UnifiedCard'
import FloatingActionButton from '../components/FloatingActionButton'

const PLATFORM_COLORS: Record<string, string> = {
  claude: '#d97706',
  chatgpt: '#19c37d',
  gemini: '#4285f4',
  deepseek: '#5b8def',
  grok: '#a855f7',
  kimi: '#06b6d4',
  default: '#6b7280',
}

function getPlatformColor(platform: string) {
  return PLATFORM_COLORS[platform?.toLowerCase()] ?? PLATFORM_COLORS.default
}

export function ListPage() {
  const navigate = useNavigate()
  const { t } = useI18n()
  const { files, loadFromFileObjects, removeFile } = useFiles()
  const setCurrentFile = useFilesStore((s) => s.setCurrentFile)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const folderInputRef = useRef<HTMLInputElement>(null)
  const [search, setSearch] = useState('')
  const [filterPlatform, setFilterPlatform] = useState('')

  const platforms = [...new Set(files.map((f) => f.platform).filter(Boolean))]

  const filtered = files.filter((f) => {
    const name = f.name.toLowerCase()
    const q = search.toLowerCase()
    if (q && !name.includes(q)) return false
    if (filterPlatform && f.platform !== filterPlatform) return false
    return true
  })

  async function handleFiles(fileList: FileList | null) {
    if (!fileList) return
    const jsonFiles = Array.from(fileList).filter((f) => f.name.endsWith('.json'))
    if (jsonFiles.length === 0) return
    await loadFromFileObjects(jsonFiles)
  }

  async function handleRemove(fileId: string, fileName: string) {
    await deleteCachedFile(fileName)
    removeFile(fileId)
  }

  function handleSelect(file: (typeof files)[0]) {
    setCurrentFile(file.id)
    navigate(`/timeline/${file.id}`)
  }

  // Build UnifiedCard-compatible item from our file
  function toCardItem(file: (typeof files)[0], index: number) {
    const parsed = file.parsed as {
      format?: string
      platform?: string
      chat_history?: unknown[]
      meta_info?: { title?: string; model?: string }
    } | null
    return {
      type: 'file',
      uuid: file.id,
      name: file.name.replace(/\.json$/, ''),
      originalName: file.name.replace(/\.json$/, ''),
      fileName: file.name,
      fileIndex: index,
      isCurrentFile: false,
      format: parsed?.format ?? parsed?.platform ?? 'unknown',
      model: parsed?.meta_info?.model ?? '',
      messageCount: parsed?.chat_history?.length ?? 0,
      conversationCount: 1,
      platform: file.platform ?? 'unknown',
      created_at: null,
      size: 0,
      summary: `${parsed?.chat_history?.length ?? 0} messages`,
    }
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, gap: 12, flexWrap: 'wrap' }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>
          {t('listPage.title') || 'Conversations'}
          <span style={{ marginLeft: 10, fontSize: 14, fontWeight: 400, color: 'var(--text-tertiary)' }}>
            {files.length} {t('listPage.files') || 'files'}
          </span>
        </h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-secondary small" onClick={() => fileInputRef.current?.click()}>
            + {t('listPage.addFile') || 'Add File'}
          </button>
          <button className="btn-secondary small" onClick={() => folderInputRef.current?.click()}>
            + {t('listPage.addFolder') || 'Add Folder'}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder={t('listPage.search') || 'Search...'}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: 1,
            minWidth: 200,
            padding: '6px 12px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-primary)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--text-primary)',
            fontSize: 13,
            outline: 'none',
          }}
        />
        {platforms.length > 1 && (
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              className={`btn-secondary small${!filterPlatform ? ' active' : ''}`}
              onClick={() => setFilterPlatform('')}
            >
              All
            </button>
            {platforms.map((p) => (
              <button
                key={p}
                className={`btn-secondary small${filterPlatform === p ? ' active' : ''}`}
                onClick={() => setFilterPlatform(filterPlatform === p ? '' : p ?? '')}
                style={filterPlatform === p ? { borderColor: getPlatformColor(p ?? ''), color: getPlatformColor(p ?? '') } : {}}
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-tertiary)' }}>
          {files.length === 0
            ? t('listPage.empty') || 'No files loaded. Drop JSON files here or click Add File.'
            : t('listPage.noResults') || 'No matching files.'}
        </div>
      ) : (
        <div className="conversations-grid">
          {filtered.map((file, i) => (
            <UnifiedCard
              key={file.id}
              item={toCardItem(file, i) as any}
              isSelected={false}
              onSelect={() => handleSelect(file)}
              onRemove={() => handleRemove(file.id, file.name)}
            />
          ))}
        </div>
      )}

      <input ref={fileInputRef} type="file" accept=".json" multiple hidden onChange={(e) => handleFiles(e.target.files)} />
      <input ref={folderInputRef} type="file" accept=".json" multiple hidden
        {...{ webkitdirectory: '', directory: '' } as React.InputHTMLAttributes<HTMLInputElement>}
        onChange={(e) => handleFiles(e.target.files)}
      />

      <FloatingActionButton
        onClick={() => fileInputRef.current?.click()}
        title="Add files"
      />
    </div>
  )
}
