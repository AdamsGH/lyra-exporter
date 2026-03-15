import type { FC } from 'react'

export interface CardItem {
  type: string
  uuid: string
  name: string
  originalName?: string
  fileName?: string
  fileIndex?: number
  isCurrentFile?: boolean
  format?: string
  model?: string
  messageCount?: number
  conversationCount?: number
  platform?: string
  created_at?: string | null
  size?: number
  summary?: string
  [key: string]: unknown
}

interface CardProps {
  item: CardItem
  isSelected?: boolean
  isStarred?: boolean
  onSelect?: (item: CardItem) => void
  onStar?: (uuid: string, isStarred: boolean) => void
  onRemove?: (fileIndex: string | number) => void
  onRename?: (uuid: string, name: string) => void
  className?: string
}

export declare const Card: FC<CardProps>
