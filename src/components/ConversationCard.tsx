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

const PLATFORM_ICONS: Record<string, string> = {
  claude:   '◆',
  chatgpt:  '⬡',
  gemini:   '✦',
  deepseek: '◉',
  grok:     '✕',
  kimi:     '◎',
  unknown:  '○',
}

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
  style?: React.CSSProperties   // passed by virtualizer
}

export const ConversationCard = memo(function ConversationCard({ data, onRemove, onRename, style }: Props) {
  const navigate = useNavigate()
  const toggleStar = useMetaStore((s) => s.toggleStar)
  const [dropOpen, setDropOpen] = useState(false)

  const platformColor = PLATFORM_COLORS[data.platform] ?? PLATFORM_COLORS.unknown
  const platformIcon  = PLATFORM_ICONS[data.platform]  ?? PLATFORM_ICONS.unknown

  const visibleTags = data.tags.slice(0, MAX_VISIBLE_TAGS)
  const hiddenCount = data.tags.length - visibleTags.length

  function handleCardClick(e: React.MouseEvent) {
    // Don't navigate if clicking interactive elements
    if ((e.target as HTMLElement).closest('button, [role="menuitem"], [role="menu"]')) return
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
      className="conversation-tile"
      style={style}
      onClick={handleCardClick}
    >
      {/* Header: platform icon + title + star + dropdown */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
        {/* Platform icon */}
        <span
          style={{
            fontSize: 18,
            color: platformColor,
            flexShrink: 0,
            lineHeight: 1.3,
            marginTop: 1,
            filter: `drop-shadow(0 0 4px ${platformColor}60)`,
          }}
          title={data.platform}
        >
          {platformIcon}
        </span>

        {/* Title */}
        <span
          style={{
            flex: 1,
            fontSize: 15,
            fontWeight: 600,
            color: 'var(--text-primary)',
            lineHeight: 1.3,
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            minWidth: 0,
          }}
          title={data.title}
        >
          {data.title}
        </span>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
          <button
            onClick={handleStar}
            title={data.starred ? 'Unstar' : 'Star'}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '2px 4px',
              borderRadius: 4,
              color: data.starred ? '#f1e05a' : 'var(--text-tertiary)',
              fontSize: 16,
              lineHeight: 1,
              display: 'flex',
              alignItems: 'center',
              transition: 'color 0.15s, transform 0.15s',
              filter: data.starred ? 'drop-shadow(0 0 3px rgba(241,224,90,0.5))' : 'none',
            }}
          >
            <Star size={15} fill={data.starred ? '#f1e05a' : 'none'} strokeWidth={1.5} />
          </button>

          <DropdownMenu open={dropOpen} onOpenChange={setDropOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={(e) => e.stopPropagation()}
                style={{ color: 'var(--text-tertiary)' }}
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
                style={{ color: 'var(--accent-danger, #ef4444)' }}
              >
                Remove
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Meta row: platform/model + date */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8, flexWrap: 'wrap' }}>
        <span style={{ color: platformColor, fontWeight: 500 }}>
          {data.platform.charAt(0).toUpperCase() + data.platform.slice(1)}
          {data.model ? ` · ${data.model}` : ''}
        </span>
        {data.createdAt && (
          <>
            <span style={{ color: 'var(--border-secondary)' }}>·</span>
            <span>{data.createdAt}</span>
          </>
        )}
        {data.projectName && (
          <>
            <span style={{ color: 'var(--border-secondary)' }}>·</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: data.projectColor ?? '#6366f1',
                  display: 'inline-block',
                  flexShrink: 0,
                }}
              />
              <span style={{ color: 'var(--text-secondary)' }}>{data.projectName}</span>
            </span>
          </>
        )}
      </div>

      {/* Tags */}
      {data.tags.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>
          {visibleTags.map((tag) => (
            <Badge key={tag} variant="secondary" style={{ fontSize: 11, padding: '1px 7px' }}>
              {tag}
            </Badge>
          ))}
          {hiddenCount > 0 && (
            <Badge variant="outline" style={{ fontSize: 11, padding: '1px 7px', color: 'var(--text-tertiary)' }}>
              +{hiddenCount}
            </Badge>
          )}
        </div>
      )}

      {/* Stats row */}
      <div style={{
        display: 'flex',
        gap: 12,
        paddingTop: 10,
        borderTop: '1px solid var(--border-primary)',
        fontSize: 12,
        color: 'var(--text-tertiary)',
      }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <MessageSquare size={12} />
          {data.messageCount} messages
        </span>
        {data.branchCount > 1 && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <GitBranch size={12} />
            {data.branchCount} branches
          </span>
        )}
      </div>
    </div>
  )
})
