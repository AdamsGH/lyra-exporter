import { useRef, useState } from 'react'
import { Upload, RefreshCw, Download, Trash2, Cloud } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useSync } from '@/hooks/useSync'
import { useFiles } from '@/hooks/useFiles'
import type { S3File } from '@/api/files'

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

interface Props {
  isOpen: boolean
  onClose: () => void
}

export function CloudPanel({ isOpen, onClose }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const { s3Files, s3Loading, uploadToS3, deleteFromS3, downloadFromS3, refreshS3Files } = useSync()
  const { loadFromFileObjects } = useFiles()

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    setError('')
    setUploading(true)
    try {
      for (const file of files) await uploadToS3(file)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleLoad(file: S3File) {
    setError('')
    try {
      const f = await downloadFromS3(file.name)
      await loadFromFileObjects([f])
      onClose()
    } catch (err) {
      setError((err as Error).message)
    }
  }

  async function handleDelete(file: S3File) {
    if (!confirm(`Delete "${file.name}" from cloud storage?`)) return
    setError('')
    try {
      await deleteFromS3(file.name)
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-[560px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Cloud className="h-4 w-4" /> Cloud Files
          </DialogTitle>
        </DialogHeader>

        {error && (
          <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">{error}</p>
        )}

        <div className="flex items-center gap-2">
          <input ref={fileInputRef} type="file" accept=".json" multiple className="hidden" onChange={handleUpload} />
          <Button size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            <Upload className="h-3.5 w-3.5" />
            {uploading ? 'Uploading...' : 'Upload JSON'}
          </Button>
          <Button variant="outline" size="sm" onClick={refreshS3Files} disabled={s3Loading}>
            <RefreshCw className={`h-3.5 w-3.5 ${s3Loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        <div className="divide-y divide-border rounded-md border border-border overflow-hidden">
          {s3Files.length === 0 && !s3Loading && (
            <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
              <Cloud className="h-8 w-8 opacity-40" />
              <p className="text-sm">No files uploaded yet</p>
            </div>
          )}
          {s3Files.map((file) => (
            <div key={file.key} className="flex items-center gap-3 px-3 py-2.5 hover:bg-muted/50 transition-colors">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatSize(file.size)} · {formatDate(file.last_modified)}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button variant="ghost" size="sm" onClick={() => handleLoad(file)}>
                  <Download className="h-3.5 w-3.5" /> Load
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(file)}>
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
