import { useNavigate } from 'react-router-dom'
import { useFilesStore } from '@/stores/filesStore'

export function ListPage() {
  const files = useFilesStore((s) => s.files)
  const navigate = useNavigate()

  if (files.length === 0) {
    navigate('/')
    return null
  }

  return (
    <div className="list-page">
      <div className="list-header">
        <h2>Conversations</h2>
        <span className="text-muted">{files.length} file{files.length !== 1 ? 's' : ''} loaded</span>
      </div>

      <div className="file-grid">
        {files.map((file) => (
          <div
            key={file.id}
            className="file-card"
            onClick={() => navigate(`/timeline/${file.id}`)}
          >
            <div className="file-card-name">{file.name}</div>
            <div className="file-card-meta">
              {new Date(file.loadedAt).toLocaleTimeString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
