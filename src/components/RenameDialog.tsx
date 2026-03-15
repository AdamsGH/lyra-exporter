import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface Props {
  open: boolean
  initialName: string
  onConfirm: (name: string) => void
  onCancel: () => void
}

export function RenameDialog({ open, initialName, onConfirm, onCancel }: Props) {
  const [value, setValue] = useState(initialName)

  useEffect(() => {
    if (open) setValue(initialName)
  }, [open, initialName])

  function handleConfirm() {
    const trimmed = value.trim()
    if (trimmed) onConfirm(trimmed)
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent style={{ maxWidth: 440 }}>
        <DialogHeader>
          <DialogTitle>Rename conversation</DialogTitle>
        </DialogHeader>
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleConfirm()
            if (e.key === 'Escape') onCancel()
          }}
          autoFocus
          placeholder="Conversation name"
        />
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button onClick={handleConfirm} disabled={!value.trim()}>Rename</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
