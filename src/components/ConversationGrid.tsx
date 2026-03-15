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

// Virtualize only for large lists
const VIRTUAL_THRESHOLD = 100
const CARD_MIN_WIDTH = 320
const CARD_HEIGHT = 200
const GAP = 16

interface SortableCardProps {
  data: CardData
  onRemove: () => void
  onRename: () => void
}

function SortableCard({ data, onRemove, onRename }: SortableCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: data.fileId,
  })

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
      }}
      {...attributes}
      {...listeners}
    >
      <ConversationCard data={data} onRemove={onRemove} onRename={onRename} />
    </div>
  )
}

// Simple CSS-grid layout for normal lists
function SimpleGrid({ items, onRemove, onRename }: { items: CardData[]; onRemove: (id: string) => void; onRename: (d: CardData) => void }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(auto-fill, minmax(${CARD_MIN_WIDTH}px, 1fr))`,
        gap: GAP,
      }}
    >
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

// Virtualised layout for large lists - groups items into rows
function VirtualGrid({ items, onRemove, onRename }: { items: CardData[]; onRemove: (id: string) => void; onRename: (d: CardData) => void }) {
  const parentRef = useRef<HTMLDivElement>(null)

  // Estimate cols based on container width; recomputed by virtualizer naturally
  const cols = Math.max(1, Math.floor((parentRef.current?.offsetWidth ?? 1200) / (CARD_MIN_WIDTH + GAP)))

  const rows: CardData[][] = []
  for (let i = 0; i < items.length; i += cols) {
    rows.push(items.slice(i, i + cols))
  }

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => CARD_HEIGHT + GAP,
    overscan: 5,
  })

  return (
    <div ref={parentRef} style={{ height: 'calc(100vh - 140px)', overflowY: 'auto' }}>
      <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
        {virtualizer.getVirtualItems().map((vRow) => (
          <div
            key={vRow.index}
            style={{
              position: 'absolute',
              top: vRow.start,
              left: 0,
              right: 0,
              display: 'grid',
              gridTemplateColumns: `repeat(${cols}, 1fr)`,
              gap: GAP,
              paddingBottom: GAP,
            }}
          >
            {rows[vRow.index].map((data) => (
              <SortableCard
                key={data.fileId}
                data={data}
                onRemove={() => onRemove(data.fileId)}
                onRename={() => onRename(data)}
              />
            ))}
          </div>
        ))}
      </div>
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
  const [renaming, setRenaming] = useState<CardData | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = items.findIndex((i) => i.fileId === active.id)
    const newIndex = items.findIndex((i) => i.fileId === over.id)
    if (oldIndex === -1 || newIndex === -1) return
    onReorder(arrayMove(items, oldIndex, newIndex).map((i) => i.fileId))
  }, [items, onReorder])

  const handleRenameConfirm = useCallback((name: string) => {
    if (renaming) {
      onRenameConfirm(renaming.fileId, name)
      setRenaming(null)
    }
  }, [renaming, onRenameConfirm])

  const useVirtual = items.length > VIRTUAL_THRESHOLD

  return (
    <>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map((i) => i.fileId)} strategy={rectSortingStrategy}>
          {useVirtual
            ? <VirtualGrid items={items} onRemove={onRemove} onRename={setRenaming} />
            : <SimpleGrid items={items} onRemove={onRemove} onRename={setRenaming} />
          }
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
