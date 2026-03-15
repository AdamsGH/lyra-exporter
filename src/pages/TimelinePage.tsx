import { useParams, useNavigate } from 'react-router-dom'
import { useFilesStore } from '@/stores/filesStore'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export function TimelinePage() {
  const { fileId } = useParams<{ fileId: string }>()
  const navigate = useNavigate()
  const file = useFilesStore((s) => s.files.find((f) => f.id === fileId))

  if (!file) {
    navigate('/')
    return null
  }

  return (
    <div className="timeline-page">
      <div className="timeline-header">
        <Button variant="ghost" size="sm" onClick={() => navigate('/list')}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <h2>{file.name}</h2>
      </div>

      <div className="timeline-placeholder">
        <p className="text-muted">Timeline view — conversation renderer coming next.</p>
        <pre style={{ fontSize: 11, maxHeight: 400, overflow: 'auto' }}>
          {JSON.stringify(file.raw, null, 2).slice(0, 2000)}...
        </pre>
      </div>
    </div>
  )
}
