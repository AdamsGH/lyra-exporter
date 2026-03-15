import { useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFiles } from '@/hooks/useFiles'
import { useI18n } from '@/i18n'

const S: Record<string, React.CSSProperties> = {
  page: {
    width: '100%',
    minHeight: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px',
  },
  hero: {
    textAlign: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 64,
    fontWeight: 700,
    background: 'var(--gradient-primary)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    margin: '0 0 12px',
    letterSpacing: 4,
  },
  subtitle: {
    fontSize: 18,
    color: 'var(--text-secondary)',
    margin: 0,
  },
  dropZone: {
    width: '100%',
    maxWidth: 560,
    border: '2px dashed var(--border-secondary)',
    borderRadius: 'var(--radius-lg)',
    padding: '48px 32px',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    background: 'var(--bg-secondary)',
    marginBottom: 32,
  },
  dropZoneActive: {
    borderColor: 'var(--accent-primary)',
    background: 'var(--bg-tertiary)',
  },
  dropIcon: {
    fontSize: 48,
    marginBottom: 16,
    opacity: 0.7,
  },
  dropText: {
    fontSize: 16,
    color: 'var(--text-primary)',
    marginBottom: 8,
  },
  dropHint: {
    fontSize: 13,
    color: 'var(--text-tertiary)',
  },
  buttons: {
    display: 'flex',
    gap: 12,
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  btnPrimary: {
    padding: '10px 24px',
    fontSize: 14,
    fontWeight: 600,
    background: 'var(--accent-primary)',
    color: 'white',
    border: 'none',
    borderRadius: 'var(--radius-sm)',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
  },
  btnSecondary: {
    padding: '10px 24px',
    fontSize: 14,
    background: 'var(--bg-tertiary)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border-primary)',
    borderRadius: 'var(--radius-sm)',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
  },
  supported: {
    marginTop: 40,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
  },
  supportedLabel: {
    fontSize: 12,
    color: 'var(--text-tertiary)',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  platforms: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  platform: {
    padding: '4px 12px',
    fontSize: 12,
    background: 'var(--bg-tertiary)',
    color: 'var(--text-secondary)',
    border: '1px solid var(--border-primary)',
    borderRadius: 20,
  },
}

const PLATFORMS = ['Claude', 'ChatGPT', 'Gemini', 'DeepSeek', 'Grok', 'Copilot', 'Kimi', 'Doubao']

export function WelcomePage() {
  const navigate = useNavigate()
  const { loadFromFileObjects } = useFiles()
  const { t } = useI18n()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const folderInputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return
    const jsonFiles = Array.from(fileList).filter((f) => f.name.endsWith('.json'))
    if (jsonFiles.length === 0) return
    await loadFromFileObjects(jsonFiles)
    navigate('/list')
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    handleFiles(e.dataTransfer.files)
  }, [])

  return (
    <div style={S.page}>
      <div style={S.hero}>
        <h1 style={S.title}>LYRA</h1>
        <p style={S.subtitle}>{t('welcomePage.subtitle') || 'AI Conversation Explorer'}</p>
      </div>

      <div
        style={{ ...S.dropZone, ...(dragging ? S.dropZoneActive : {}) }}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <div style={S.dropIcon}>📂</div>
        <p style={S.dropText}>{t('welcomePage.dropzone.title') || 'Drop your JSON files here'}</p>
        <p style={S.dropHint}>{t('welcomePage.dropzone.hint') || 'or click to browse files'}</p>
      </div>

      <div style={S.buttons}>
        <button style={S.btnPrimary} onClick={() => fileInputRef.current?.click()}>
          📄 {t('welcomePage.loadFile') || 'Load File'}
        </button>
        <button style={S.btnSecondary} onClick={() => folderInputRef.current?.click()}>
          📁 {t('welcomePage.loadFolder') || 'Load Folder'}
        </button>
      </div>

      <div style={S.supported}>
        <span style={S.supportedLabel}>{t('welcomePage.supportedPlatforms') || 'Supported Platforms'}</span>
        <div style={S.platforms}>
          {PLATFORMS.map((p) => (
            <span key={p} style={S.platform}>{p}</span>
          ))}
        </div>
      </div>

      <input ref={fileInputRef} type="file" accept=".json" multiple hidden onChange={(e) => handleFiles(e.target.files)} />
      <input ref={folderInputRef} type="file" accept=".json" multiple hidden
        {...{ webkitdirectory: '', directory: '' } as React.InputHTMLAttributes<HTMLInputElement>}
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  )
}
