import type { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { Navbar } from './Navbar'

interface PageShellProps {
  children: ReactNode
}

export function PageShell({ children }: PageShellProps) {
  const location = useLocation()
  const isTimeline = location.pathname.startsWith('/timeline/')
  const isList = location.pathname === '/list'

  if (isTimeline) {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
        {children}
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <main style={{
        flex: 1,
        padding: '24px 20px',
        width: '100%',
        // ListPage gets full width for the card grid
        maxWidth: isList ? 'none' : 960,
        margin: '0 auto',
        boxSizing: 'border-box',
      }}>
        {children}
      </main>
    </div>
  )
}
