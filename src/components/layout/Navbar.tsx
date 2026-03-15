import { useNavigate } from 'react-router-dom'
import { CloudPanel } from '@/components/cloud/CloudPanel'
import { OrganizePanel } from '@/components/layout/OrganizePanel'
import { SettingsPanel } from '@/components/layout/SettingsPanel'
import { useState } from 'react'

const navStyle: React.CSSProperties = {
  background: 'var(--bg-overlay)',
  backdropFilter: 'blur(10px)',
  borderBottom: '1px solid var(--border-primary)',
  padding: '10px 20px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  position: 'sticky',
  top: 0,
  zIndex: 1000,
  flexShrink: 0,
}

const logoStyle: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 700,
  background: 'var(--gradient-primary)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
  cursor: 'pointer',
  letterSpacing: 2,
}

export function Navbar() {
  const navigate = useNavigate()
  const [showCloud, setShowCloud] = useState(false)
  const [showOrganize, setShowOrganize] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  return (
    <>
      <nav style={navStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <span style={logoStyle} onClick={() => navigate('/')}>LYRA</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <NavBtn onClick={() => setShowCloud(true)}>☁ Cloud</NavBtn>
          <NavBtn onClick={() => setShowOrganize(true)}>✦ Organize</NavBtn>
          <NavBtn onClick={() => setShowSettings(true)}>⚙ Settings</NavBtn>
        </div>
      </nav>
      <CloudPanel isOpen={showCloud} onClose={() => setShowCloud(false)} />
      <OrganizePanel isOpen={showOrganize} onClose={() => setShowOrganize(false)} />
      <SettingsPanel isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </>
  )
}

function NavBtn({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '4px 12px',
        fontSize: 12,
        background: 'var(--bg-tertiary)',
        color: 'var(--text-primary)',
        border: '1px solid var(--border-primary)',
        borderRadius: 'var(--radius-sm)',
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        transition: 'all 0.15s ease',
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--border-primary)' }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-tertiary)' }}
    >
      {children}
    </button>
  )
}
