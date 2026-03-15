import { useState } from 'react'
import { Plus, Pencil, Trash2, FolderKanban } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useProjectsStore } from '@/stores/projectsStore'
import type { Project, Account } from '@/api/projects'
import { cn } from '@/lib/utils'

interface Props { isOpen: boolean; onClose: () => void }

const PLATFORMS = ['Claude', 'ChatGPT', 'Gemini', 'Grok', 'Copilot', 'Other']
const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#64748b']

function ProjectForm({ initial, onSave, onCancel }: {
  initial?: Partial<Project>
  onSave: (d: Omit<Project, 'id'>) => Promise<void>
  onCancel: () => void
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [color, setColor] = useState(initial?.color ?? COLORS[0])
  const [description, setDescription] = useState(initial?.description ?? '')
  const [saving, setSaving] = useState(false)

  async function submit() {
    if (!name.trim()) return
    setSaving(true)
    await onSave({ name: name.trim(), color, description })
    setSaving(false)
  }

  return (
    <div className="flex flex-col gap-3 p-3 rounded-md border border-border bg-muted/30">
      <div className="grid gap-1.5">
        <Label htmlFor="proj-name">Name</Label>
        <Input id="proj-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Project name" />
      </div>
      <div className="grid gap-1.5">
        <Label>Color</Label>
        <div className="flex gap-1.5">
          {COLORS.map((c) => (
            <button
              key={c}
              className={cn('h-6 w-6 rounded-full border-2 transition-transform hover:scale-110', color === c ? 'border-foreground scale-110' : 'border-transparent')}
              style={{ background: c }}
              onClick={() => setColor(c)}
              type="button"
            />
          ))}
        </div>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="proj-desc">Description</Label>
        <Input id="proj-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional" />
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={submit} disabled={!name.trim() || saving}>
          {saving ? 'Saving...' : 'Save'}
        </Button>
        <Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  )
}

function AccountForm({ initial, onSave, onCancel }: {
  initial?: Partial<Account>
  onSave: (d: Omit<Account, 'id'>) => Promise<void>
  onCancel: () => void
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [platform, setPlatform] = useState(initial?.platform ?? PLATFORMS[0])
  const [notes, setNotes] = useState(initial?.notes ?? '')
  const [saving, setSaving] = useState(false)

  async function submit() {
    if (!name.trim()) return
    setSaving(true)
    await onSave({ name: name.trim(), platform, notes })
    setSaving(false)
  }

  return (
    <div className="flex flex-col gap-3 p-3 rounded-md border border-border bg-muted/30">
      <div className="grid gap-1.5">
        <Label htmlFor="acc-name">Account name</Label>
        <Input id="acc-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Work account" />
      </div>
      <div className="grid gap-1.5">
        <Label>Platform</Label>
        <Select value={platform} onValueChange={setPlatform}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {PLATFORMS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="acc-notes">Notes</Label>
        <Input id="acc-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional" />
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={submit} disabled={!name.trim() || saving}>
          {saving ? 'Saving...' : 'Save'}
        </Button>
        <Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  )
}

export function OrganizePanel({ isOpen, onClose }: Props) {
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [editingAccount, setEditingAccount] = useState<Account | null>(null)
  const [addingProject, setAddingProject] = useState(false)
  const [addingAccount, setAddingAccount] = useState(false)
  const { projects, accounts, createProject, updateProject, deleteProject, createAccount, updateAccount, deleteAccount } = useProjectsStore()

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-[560px] bg-[var(--bg-secondary)] border-[var(--border-primary)]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderKanban className="h-4 w-4" /> Organize
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="projects">
          <TabsList className="w-full">
            <TabsTrigger value="projects" className="flex-1">Projects</TabsTrigger>
            <TabsTrigger value="accounts" className="flex-1">Accounts</TabsTrigger>
          </TabsList>

          <TabsContent value="projects" className="space-y-2 mt-3">
            {projects.map((p) =>
              editingProject?.id === p.id ? (
                <ProjectForm
                  key={p.id}
                  initial={p}
                  onSave={async (d) => { await updateProject(p.id, d); setEditingProject(null) }}
                  onCancel={() => setEditingProject(null)}
                />
              ) : (
                <div key={p.id} className="flex items-center gap-2.5 px-3 py-2 rounded-md border border-border hover:bg-muted/50 group">
                  <span className="h-3 w-3 rounded-full shrink-0" style={{ background: p.color }} />
                  <span className="text-sm font-medium flex-1">{p.name}</span>
                  {p.description && <span className="text-xs text-muted-foreground truncate max-w-[160px]">{p.description}</span>}
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditingProject(p)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteProject(p.id)}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>
              )
            )}
            {addingProject ? (
              <ProjectForm
                onSave={async (d) => { await createProject(d); setAddingProject(false) }}
                onCancel={() => setAddingProject(false)}
              />
            ) : (
              <Button variant="outline" size="sm" className="w-full" onClick={() => setAddingProject(true)}>
                <Plus className="h-4 w-4" /> Add project
              </Button>
            )}
          </TabsContent>

          <TabsContent value="accounts" className="space-y-2 mt-3">
            {accounts.map((a) =>
              editingAccount?.id === a.id ? (
                <AccountForm
                  key={a.id}
                  initial={a}
                  onSave={async (d) => { await updateAccount(a.id, d); setEditingAccount(null) }}
                  onCancel={() => setEditingAccount(null)}
                />
              ) : (
                <div key={a.id} className="flex items-center gap-2.5 px-3 py-2 rounded-md border border-border hover:bg-muted/50 group">
                  <span className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded text-muted-foreground shrink-0">{a.platform}</span>
                  <span className="text-sm font-medium flex-1">{a.name}</span>
                  {a.notes && <span className="text-xs text-muted-foreground truncate max-w-[160px]">{a.notes}</span>}
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditingAccount(a)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteAccount(a.id)}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>
              )
            )}
            {addingAccount ? (
              <AccountForm
                onSave={async (d) => { await createAccount(d); setAddingAccount(false) }}
                onCancel={() => setAddingAccount(false)}
              />
            ) : (
              <Button variant="outline" size="sm" className="w-full" onClick={() => setAddingAccount(true)}>
                <Plus className="h-4 w-4" /> Add account
              </Button>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
