import { useNavigate } from 'react-router-dom'
import { Cloud, Settings, FolderKanban, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useUiStore } from '@/stores/uiStore'
import { useFilesStore } from '@/stores/filesStore'
import { CloudPanel } from '@/components/cloud/CloudPanel'
import { SettingsPanel } from '@/components/layout/SettingsPanel'
import { OrganizePanel } from '@/components/layout/OrganizePanel'

export function Navbar() {
  const { backendAvailable, openPanel, setOpenPanel } = useUiStore()
  const { files, clearFiles } = useFilesStore()
  const navigate = useNavigate()

  function handleHome() {
    clearFiles()
    navigate('/')
  }

  return (
    <>
      <header className="sticky top-0 z-40 flex h-12 items-center border-b border-border bg-card px-4 gap-3">
        <button
          onClick={handleHome}
          className="text-sm font-semibold text-foreground hover:text-primary transition-colors"
        >
          Lyra Exporter
        </button>

        {files.length > 0 && (
          <>
            <Separator orientation="vertical" className="h-4" />
            <Button variant="ghost" size="sm" onClick={handleHome}>
              <Plus className="h-4 w-4" />
              New
            </Button>
          </>
        )}

        <div className="ml-auto flex items-center gap-1">
          {backendAvailable && (
            <Button
              variant={openPanel === 'cloud' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setOpenPanel('cloud')}
            >
              <Cloud className="h-4 w-4" />
              Cloud
            </Button>
          )}

          {backendAvailable && (
            <Button
              variant={openPanel === 'organize' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setOpenPanel('organize')}
            >
              <FolderKanban className="h-4 w-4" />
              Organize
            </Button>
          )}

          <Button
            variant={openPanel === 'settings' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setOpenPanel('settings')}
          >
            <Settings className="h-4 w-4" />
            Settings
          </Button>
        </div>
      </header>

      <CloudPanel isOpen={openPanel === 'cloud'} onClose={() => setOpenPanel(null)} />
      <SettingsPanel isOpen={openPanel === 'settings'} onClose={() => setOpenPanel(null)} />
      <OrganizePanel isOpen={openPanel === 'organize'} onClose={() => setOpenPanel(null)} />
    </>
  )
}
