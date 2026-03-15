import { useCallback } from 'react'
import { useFilesStore } from '@/stores/filesStore'
import type { LoadedFile } from '@/stores/filesStore'
import { extractChatData, detectBranches, detectFileFormat } from '@/parsers/index'
import { cacheFile } from '@/lib/storage'

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function parseRaw(raw: unknown, name: string): Omit<LoadedFile, 'id' | 'name' | 'raw' | 'loadedAt'> {
  const format = detectFileFormat(raw)
  if (format === 'unknown') return { platform: 'unknown' }
  try {
    const extracted = extractChatData(raw, name)
    const parsed = detectBranches(extracted)
    return {
      parsed,
      platform: (parsed as { platform?: string })?.platform ?? format,
    }
  } catch {
    return { platform: format }
  }
}

export function useFiles() {
  const { files, currentFileId, addFiles, removeFile, setCurrentFile, clearFiles } = useFilesStore()

  // IndexedDB restore is handled in App.tsx to avoid double-init

  const loadFromFileObjects = useCallback(async (fileObjects: File[]) => {
    const loaded: LoadedFile[] = []
    for (const file of fileObjects) {
      try {
        const text = await file.text()
        const raw = JSON.parse(text)
        await cacheFile(file.name, raw)
        loaded.push({
          id: generateId(),
          name: file.name,
          raw,
          loadedAt: Date.now(),
          ...parseRaw(raw, file.name),
        })
      } catch (e) {
        console.error(`Failed to load ${file.name}:`, e)
      }
    }
    if (loaded.length > 0) addFiles(loaded)
    return loaded
  }, [addFiles])

  const currentFile = files.find((f) => f.id === currentFileId) ?? null

  return { files, currentFile, currentFileId, loadFromFileObjects, removeFile, setCurrentFile, clearFiles }
}
