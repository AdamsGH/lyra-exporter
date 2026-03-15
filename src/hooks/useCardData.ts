import { useMemo } from 'react'
import type { LoadedFile } from '@/stores/filesStore'
import { useMetaStore } from '@/stores/metaStore'
import { useProjectsStore } from '@/stores/projectsStore'

// Shape of parsed conversation data coming from the JS parsers
interface ParsedConversation {
  format?: string
  platform?: string
  meta_info?: {
    title?: string
    model?: string
    created_at?: string
    updated_at?: string
  }
  chat_history?: unknown[]
  branches?: unknown[]
  branch_points?: unknown[]
}

export interface CardData {
  // Identity
  conversationId: string   // uuid from parsed JSON used for meta lookups
  fileId: string           // local store id

  // Display
  title: string
  platform: string
  format: string
  model: string
  createdAt: string | null // already formatted by parser e.g. "Mar 14, 2025"

  // Stats
  messageCount: number
  branchCount: number

  // Meta (from metaStore / API)
  starred: boolean
  tags: string[]
  projectId: number | null
  projectName: string | null
  projectColor: string | null
}

export function useCardData(file: LoadedFile): CardData {
  const parsed = file.parsed as ParsedConversation | undefined
  const metaMap = useMetaStore((s) => s.meta)
  const projects = useProjectsStore((s) => s.projects)

  return useMemo(() => {
    const meta_info = parsed?.meta_info ?? {}
    const chat_history = parsed?.chat_history ?? []
    const branches = parsed?.branches ?? []

    // Conversation UUID: prefer parsed JSON uuid, fall back to file id
    // The JS parsers store it in meta_info or at root level
    const rawParsed = parsed as (ParsedConversation & { uuid?: string }) | undefined
    const conversationId = rawParsed?.uuid ?? meta_info.title ?? file.id

    const meta = metaMap[conversationId]

    const projectId = meta?.project_id ?? null
    const project = projectId ? projects.find((p) => p.id === projectId) ?? null : null

    return {
      conversationId,
      fileId: file.id,

      title: file.name.replace(/\.json$/, ''),
      platform: parsed?.platform ?? file.platform ?? 'unknown',
      format: parsed?.format ?? file.platform ?? 'unknown',
      model: meta_info.model ?? '',
      createdAt: meta_info.created_at ?? null,

      messageCount: chat_history.length,
      branchCount: branches.length,

      starred: meta?.starred ?? false,
      tags: meta?.tags ?? [],
      projectId,
      projectName: project?.name ?? null,
      projectColor: project?.color ?? null,
    }
  }, [file, parsed, metaMap, projects])
}
