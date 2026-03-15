import { useRef, useState, useCallback, useLayoutEffect } from 'react'
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

const CARD_MIN_WIDTH = 300
const CARD_HEIGHT = 195
const GAP = 20

function calcCols(width: number) {
  return Math.max(1, Math.floor((width + GAP) / (CARD_MIN_WIDTH + GAP)))
}

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
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <ConversationCard data={data} onRemove={onRemove} onRename={onRename} />
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
  const [cols, setCols] = useState(3)
  const [renaming, setRenaming] = useState<CardData | null>(null)

  // Measure container width and recalculate columns
  useLayoutEffect(() => {
    const el = parentRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      setCols(calcCols(entry.contentRect.width))
    })
    ro.observe(el)
    setCols(calcCols(el.offsetWidth))
    return () => ro.disconnect()
  }, [])

  // Split into rows based on current col count
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

  return (
    <>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map((i) => i.fileId)} strategy={rectSortingStrategy}>
          <div
            ref={parentRef}
            style={{ height: 'calc(100vh - 130px)', overflowY: 'auto', paddingRight: 4 }}
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
                    display: 'grid',
                    gridTemplateColumns: `repeat(${cols}, 1fr)`,
                    gap: GAP,
                    paddingBottom: GAP,
                    alignItems: 'start',
                  }}
                >
                  {rows[vRow.index].map((data) => (
                    <SortableCard
                      key={data.fileId}
                      data={data}
                      onRemove={() => onRemove(data.fileId)}
                      onRename={() => setRenaming(data)}
                    />
                  ))}
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
