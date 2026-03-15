import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CloudPanel } from '@/components/cloud/CloudPanel'
import { OrganizePanel } from '@/components/layout/OrganizePanel'
import { SettingsPanel } from '@/components/layout/SettingsPanel'

export function Navbar() {
  const navigate = useNavigate()
  const [showCloud, setShowCloud] = useState(false)
  const [showOrganize, setShowOrganize] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  return (
    <>
      <nav className="navbar-redesigned">
        <div className="navbar-left">
          <div className="logo" onClick={() => navigate('/')}>
            <span className="logo-text">LYRA</span>
          </div>
        </div>
        <div className="navbar-right">
          <button className="btn-secondary small" onClick={() => setShowCloud(true)}>
            ☁ Cloud
          </button>
          <button className="btn-secondary small" onClick={() => setShowOrganize(true)}>
            ✦ Organize
          </button>
          <button className="btn-secondary small" onClick={() => setShowSettings(true)}>
            ⚙ Settings
          </button>
        </div>
      </nav>
      <CloudPanel isOpen={showCloud} onClose={() => setShowCloud(false)} />
      <OrganizePanel isOpen={showOrganize} onClose={() => setShowOrganize(false)} />
      <SettingsPanel isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </>
  )
}
