import type { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { Navbar } from './Navbar'

interface PageShellProps {
  children: ReactNode
}

export function PageShell({ children }: PageShellProps) {
  const location = useLocation()
  const isTimeline = location.pathname.startsWith('/timeline/')

  if (isTimeline) {
    // Timeline manages its own full-height layout
    return <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>{children}</div>
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <main style={{ flex: 1, padding: '24px 20px', maxWidth: 960, width: '100%', margin: '0 auto' }}>
        {children}
      </main>
    </div>
  )
}
