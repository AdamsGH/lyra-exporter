import { useRef, useState, useCallback } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  rectSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ConversationCard } from './ConversationCard'
import { RenameDialog } from './RenameDialog'
import type { CardData } from '@/hooks/useCardData'

// Number of columns in the grid - mirrors .conversations-grid
const COLS = 3
const CARD_HEIGHT = 190  // approximate card height in px
const GAP = 20

interface SortableCardProps {
  data: CardData
  onRemove: () => void
  onRename: () => void
}

function SortableCard({ data, onRemove, onRename }: SortableCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: data.fileId,
  })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    cursor: isDragging ? 'grabbing' : 'grab',
    touchAction: 'none',
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <ConversationCard data={data} onRemove={onRemove} onRename={onRename} />
    </div>
  )
}

interface VirtualRowProps {
  items: CardData[]
  onRemove: (fileId: string) => void
  onRename: (data: CardData) => void
}

function GridRow({ items, onRemove, onRename }: VirtualRowProps) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${COLS}, 1fr)`, gap: GAP }}>
      {items.map((data) => (
        <SortableCard
          key={data.fileId}
          data={data}
          onRemove={() => onRemove(data.fileId)}
          onRename={() => onRename(data)}
        />
      ))}
    </div>
  )
}

interface Props {
  items: CardData[]
  onRemove: (fileId: string) => void
  onReorder: (orderedIds: string[]) => void
  onRenameConfirm: (fileId: string, name: string) => void
}

export function ConversationGrid({ items, onRemove, onReorder, onRenameConfirm }: Props) {
  const parentRef = useRef<HTMLDivElement>(null)
  const [renaming, setRenaming] = useState<CardData | null>(null)

  // Split items into rows of COLS
  const rows: CardData[][] = []
  for (let i = 0; i < items.length; i += COLS) {
    rows.push(items.slice(i, i + COLS))
  }

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => CARD_HEIGHT + GAP,
    overscan: 3,
  })

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = items.findIndex((i) => i.fileId === active.id)
    const newIndex = items.findIndex((i) => i.fileId === over.id)
    if (oldIndex === -1 || newIndex === -1) return
    const reordered = arrayMove(items, oldIndex, newIndex)
    onReorder(reordered.map((i) => i.fileId))
  }, [items, onReorder])

  const handleRenameConfirm = useCallback((name: string) => {
    if (renaming) {
      onRenameConfirm(renaming.fileId, name)
      setRenaming(null)
    }
  }, [renaming, onRenameConfirm])

  return (
    <>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map((i) => i.fileId)} strategy={rectSortingStrategy}>
          <div
            ref={parentRef}
            style={{ height: 'calc(100vh - 140px)', overflowY: 'auto', paddingRight: 4 }}
          >
            <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
              {virtualizer.getVirtualItems().map((vRow) => (
                <div
                  key={vRow.index}
                  style={{
                    position: 'absolute',
                    top: vRow.start,
                    left: 0,
                    right: 0,
                    height: vRow.size,
                    paddingBottom: GAP,
                  }}
                >
                  <GridRow
                    items={rows[vRow.index]}
                    onRemove={onRemove}
                    onRename={setRenaming}
                  />
                </div>
              ))}
            </div>
          </div>
        </SortableContext>
      </DndContext>

      <RenameDialog
        open={renaming !== null}
        initialName={renaming?.title ?? ''}
        onConfirm={handleRenameConfirm}
        onCancel={() => setRenaming(null)}
      />
    </>
  )
}
