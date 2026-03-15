import { memo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MoreHorizontal, Star, GitBranch, MessageSquare } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useMetaStore } from '@/stores/metaStore'
import type { CardData } from '@/hooks/useCardData'

const MAX_VISIBLE_TAGS = 3

const PLATFORM_COLORS: Record<string, string> = {
  claude:   '#d97706',
  chatgpt:  '#19c37d',
  gemini:   '#4285f4',
  deepseek: '#5b8def',
  grok:     '#a855f7',
  kimi:     '#06b6d4',
  unknown:  '#6b7280',
}

interface Props {
  data: CardData
  onRemove: () => void
  onRename: () => void
}

export const ConversationCard = memo(function ConversationCard({ data, onRemove, onRename }: Props) {
  const navigate = useNavigate()
  const toggleStar = useMetaStore((s) => s.toggleStar)
  const [dropOpen, setDropOpen] = useState(false)

  const platformColor = PLATFORM_COLORS[data.platform] ?? PLATFORM_COLORS.unknown
  const platformLabel = data.platform.charAt(0).toUpperCase() + data.platform.slice(1)

  const visibleTags = data.tags.slice(0, MAX_VISIBLE_TAGS)
  const hiddenCount = data.tags.length - visibleTags.length

  function handleCardClick(e: React.MouseEvent) {
    if ((e.target as HTMLElement).closest('button,[role="menuitem"],[role="menu"]')) return
    navigate(`/timeline/${data.fileId}`)
  }

  function handleStar(e: React.MouseEvent) {
    e.stopPropagation()
    toggleStar(data.conversationId)
  }

  function copyTitle() {
    navigator.clipboard.writeText(data.title).catch(() => {})
  }

  return (
    <div
      className="rounded-lg border border-border bg-card p-4 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:border-border/80 flex flex-col gap-3"
      onClick={handleCardClick}
    >
      {/* Header: title + star + dropdown */}
      <div className="flex items-start gap-2 min-w-0">
        {/* Platform color dot */}
        <span
          className="mt-1 shrink-0 w-2 h-2 rounded-full"
          style={{ background: platformColor, boxShadow: `0 0 6px ${platformColor}80` }}
        />

        {/* Title */}
        <span className="flex-1 min-w-0 text-sm font-semibold leading-snug line-clamp-2">
          {data.title}
        </span>

        {/* Actions */}
        <div className="flex items-center gap-0.5 shrink-0 -mt-0.5">
          <button
            onClick={handleStar}
            title={data.starred ? 'Unstar' : 'Star'}
            className="p-1 rounded hover:bg-accent transition-colors"
          >
            <Star
              size={14}
              fill={data.starred ? '#f1e05a' : 'none'}
              stroke={data.starred ? '#f1e05a' : 'currentColor'}
              strokeWidth={1.5}
              className={data.starred ? '' : 'text-muted-foreground'}
            />
          </button>

          <DropdownMenu open={dropOpen} onOpenChange={setDropOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal size={14} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem onClick={() => navigate(`/timeline/${data.fileId}`)}>
                Open in timeline
              </DropdownMenuItem>
              <DropdownMenuItem onClick={copyTitle}>
                Copy title
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onRename}>
                Rename
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={onRemove}
                className="text-destructive focus:text-destructive"
              >
                Remove
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Meta: platform/model left, date right */}
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="font-medium truncate" style={{ color: platformColor }}>
          {platformLabel}{data.model ? ` · ${data.model}` : ''}
        </span>
        {data.createdAt && (
          <span className="text-muted-foreground shrink-0">{data.createdAt}</span>
        )}
      </div>

      {/* Project */}
      {data.projectName && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ background: data.projectColor ?? '#6366f1' }}
          />
          {data.projectName}
        </div>
      )}

      {/* Tags */}
      {data.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {visibleTags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-[11px] px-1.5 py-0">
              {tag}
            </Badge>
          ))}
          {hiddenCount > 0 && (
            <Badge variant="outline" className="text-[11px] px-1.5 py-0 text-muted-foreground">
              +{hiddenCount}
            </Badge>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="flex items-center gap-3 pt-2 border-t border-border text-xs text-muted-foreground mt-auto">
        <span className="flex items-center gap-1">
          <MessageSquare className="h-3.5 w-3.5" />
          {data.messageCount} messages
        </span>
        {data.branchCount > 1 && (
          <span className="flex items-center gap-1">
            <GitBranch className="h-3.5 w-3.5" />
            {data.branchCount} branches
          </span>
        )}
      </div>
    </div>
  )
})
