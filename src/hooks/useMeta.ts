import { useMetaStore } from '@/stores/metaStore'

export function useMeta(conversationId: string) {
  const { getMeta, update } = useMetaStore()
  const meta = getMeta(conversationId)

  const setTags = (tags: string[]) => update(conversationId, { tags })
  const setStarred = (starred: boolean) => update(conversationId, { starred })
  const setNotes = (notes: string) => update(conversationId, { notes })
  const setProject = (project_id: number | null) => update(conversationId, { project_id })
  const setAccount = (account_id: number | null) => update(conversationId, { account_id })
  const setStatus = (status: string) => update(conversationId, { status })

  return { meta, setTags, setStarred, setNotes, setProject, setAccount, setStatus }
}
