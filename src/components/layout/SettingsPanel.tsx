import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface Props { isOpen: boolean; onClose: () => void }

export function SettingsPanel({ isOpen, onClose }: Props) {
  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">Settings coming soon.</p>
      </DialogContent>
    </Dialog>
  )
}
