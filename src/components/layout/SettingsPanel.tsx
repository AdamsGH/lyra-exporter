// Re-export original SettingsManager as SettingsPanel
// Props match: isOpen, onClose
import OriginalSettingsPanel from '../SettingsManager'

interface Props { isOpen: boolean; onClose: () => void }

export function SettingsPanel({ isOpen, onClose }: Props) {
  return <OriginalSettingsPanel isOpen={isOpen} onClose={onClose} exportOptions={null} setExportOptions={() => {}} />
}
