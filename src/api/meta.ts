import { api } from './client'

export interface ConversationMeta {
  conversation_id: string
  tags: string[]
  starred: boolean
  notes: string
  project_id?: number | null
  account_id?: number | null
  status?: string
  updated_at?: string
}

export const metaApi = {
  getAll: () => api.get<ConversationMeta[]>('/meta'),

  get: (conversationId: string) =>
    api.get<ConversationMeta>(`/meta/${encodeURIComponent(conversationId)}`),

  update: (conversationId: string, meta: Partial<Omit<ConversationMeta, 'conversation_id' | 'updated_at'>>) =>
    api.put<{ ok: boolean }>(`/meta/${encodeURIComponent(conversationId)}`, meta),
}
