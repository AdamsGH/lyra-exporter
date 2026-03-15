import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { PageShell } from '@/components/layout/PageShell'
import { WelcomePage } from '@/pages/WelcomePage'
import { ListPage } from '@/pages/ListPage'
import { TimelinePage } from '@/pages/TimelinePage'
import { useSync } from '@/hooks/useSync'
import { useFilesStore } from '@/stores/filesStore'

export default function App() {
  useSync()

  const files = useFilesStore((s) => s.files)
  const hasFiles = files.length > 0

  return (
    <PageShell>
      <Routes>
        <Route path="/" element={hasFiles ? <Navigate to="/list" replace /> : <WelcomePage />} />
        <Route path="/list" element={<ListPage />} />
        <Route path="/timeline/:fileId" element={<TimelinePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </PageShell>
  )
}
