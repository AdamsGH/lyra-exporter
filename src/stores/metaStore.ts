import { create } from 'zustand'
import type { ConversationMeta } from '@/api/meta'
import { metaApi } from '@/api/meta'

interface MetaState {
  meta: Record<string, ConversationMeta>
  loaded: boolean
  load: () => Promise<void>
  update: (conversationId: string, patch: Partial<Omit<ConversationMeta, 'conversation_id'>>) => Promise<void>
  getMeta: (conversationId: string) => ConversationMeta
}

const DEFAULT_META = (id: string): ConversationMeta => ({
  conversation_id: id,
  tags: [],
  starred: false,
  notes: '',
  project_id: null,
  account_id: null,
  status: '',
})

export const useMetaStore = create<MetaState>((set, get) => ({
  meta: {},
  loaded: false,

  load: async () => {
    try {
      const all = await metaApi.getAll()
      const map: Record<string, ConversationMeta> = {}
      for (const m of all) {
        map[m.conversation_id] = m
      }
      set({ meta: map, loaded: true })
    } catch {
      set({ loaded: true })
    }
  },

  update: async (conversationId, patch) => {
    const current = get().getMeta(conversationId)
    const updated = { ...current, ...patch }
    set((s) => ({ meta: { ...s.meta, [conversationId]: updated } }))
    try {
      await metaApi.update(conversationId, patch)
    } catch (e) {
      console.error('meta sync failed:', e)
    }
  },

  getMeta: (conversationId) =>
    get().meta[conversationId] ?? DEFAULT_META(conversationId),
}))
