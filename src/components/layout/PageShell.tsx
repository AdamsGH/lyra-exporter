import type { ReactNode } from 'react'
import { Navbar } from './Navbar'

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}
