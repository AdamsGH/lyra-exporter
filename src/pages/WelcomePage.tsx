import { useCallback, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, Cloud, FileJson, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useFiles } from '@/hooks/useFiles'
import { useSync } from '@/hooks/useSync'
import { cn } from '@/lib/utils'
import type { S3File } from '@/api/files'

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export function WelcomePage() {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const { loadFromFileObjects } = useFiles()
  const { backendAvailable, s3Files, s3Loading, uploadToS3, downloadFromS3, refreshS3Files } = useSync()

  async function handleFiles(fileList: FileList | File[]) {
    const files = Array.from(fileList).filter((f) => f.name.endsWith('.json'))
    if (!files.length) { setError('Only .json files are supported'); return }
    setError('')
    await loadFromFileObjects(files)

    if (backendAvailable) {
      setUploading(true)
      try { for (const f of files) await uploadToS3(f) } catch { /* silent */ }
      finally { setUploading(false) }
    }

    navigate('/list')
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    handleFiles(e.dataTransfer.files)
  }

  async function loadFromCloud(file: S3File) {
    setError('')
    try {
      const f = await downloadFromS3(file.name)
      await loadFromFileObjects([f])
      navigate('/list')
    } catch (err) {
      setError((err as Error).message)
    }
  }

  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setDragging(true) }, [])
  const handleDragLeave = useCallback(() => setDragging(false), [])

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl flex flex-col items-center gap-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">Lyra Exporter</h1>
        <p className="mt-2 text-muted-foreground">Manage and explore your AI chat conversations</p>
      </div>

      {error && (
        <p className="text-sm text-destructive bg-destructive/10 rounded-md px-4 py-2">{error}</p>
      )}

      <div
        className={cn(
          'w-full max-w-lg rounded-xl border-2 border-dashed p-10 flex flex-col items-center gap-4 cursor-pointer transition-colors',
          dragging ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/50 hover:bg-muted/30',
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
        <FileJson className="h-10 w-10 text-muted-foreground" strokeWidth={1.5} />
        <div className="text-center">
          <p className="font-medium">Drop JSON files here</p>
          <p className="text-sm text-muted-foreground mt-1">Claude, ChatGPT, Gemini, Grok and more</p>
        </div>
        <Button size="sm" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click() }}>
          <Upload className="h-4 w-4" />
          Browse files
        </Button>
        {uploading && (
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <RefreshCw className="h-3 w-3 animate-spin" /> Saving to cloud...
          </p>
        )}
      </div>

      {backendAvailable && (
        <div className="w-full max-w-lg">
          <Separator className="mb-6" />
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <Cloud className="h-4 w-4" /> Cloud Files
            </h2>
            <Button variant="ghost" size="sm" onClick={refreshS3Files} disabled={s3Loading}>
              <RefreshCw className={cn('h-3.5 w-3.5', s3Loading && 'animate-spin')} />
              Refresh
            </Button>
          </div>

          {s3Files.length === 0 && !s3Loading ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No files yet. Drop a file above to save it to the cloud.
            </p>
          ) : (
            <div className="rounded-md border border-border divide-y divide-border overflow-hidden">
              {s3Files.map((file) => (
                <div
                  key={file.key}
                  className="flex items-center gap-3 px-3 py-2.5 hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => loadFromCloud(file)}
                >
                  <FileJson className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatSize(file.size)} · {new Date(file.last_modified).toLocaleDateString()}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); loadFromCloud(file) }}>
                    Load
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
