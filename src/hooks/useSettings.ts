import { useEffect, useState, useCallback } from 'react'
import { settingsApi } from '@/api/settings'
import type { UserSettings } from '@/api/settings'
import { useUiStore } from '@/stores/uiStore'

export function useSettings() {
  const { backendAvailable } = useUiStore()
  const [settings, setSettings] = useState<UserSettings>({})

  useEffect(() => {
    if (!backendAvailable) return
    settingsApi.get().then(({ settings }) => setSettings(settings ?? {})).catch(() => {})
  }, [backendAvailable])

  const save = useCallback(async (patch: UserSettings) => {
    const merged = { ...settings, ...patch }
    setSettings(merged)
    if (backendAvailable) {
      await settingsApi.save(merged).catch(console.error)
    }
  }, [settings, backendAvailable])

  return { settings, save }
}
