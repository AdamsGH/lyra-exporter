import { api } from './client'

export interface UserSettings {
  theme?: string
  language?: string
  defaultViewMode?: string
  [key: string]: unknown
}

export const settingsApi = {
  get: () => api.get<{ settings: UserSettings }>('/settings'),
  save: (settings: UserSettings) => api.put<{ ok: boolean }>('/settings', { settings }),
}
