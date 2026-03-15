import { useCallback, useEffect } from 'react'
import { useFilesStore } from '@/stores/filesStore'
import type { LoadedFile } from '@/stores/filesStore'
import { extractChatData, detectBranches, detectFileFormat } from '@/parsers/index'
import { cacheFile, getAllCachedFiles } from '@/lib/storage'

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

  // Restore from IndexedDB on first mount (only when store is empty)
  useEffect(() => {
    if (files.length > 0) return
    getAllCachedFiles().then((cached) => {
      if (cached.length === 0) return
      const loaded: LoadedFile[] = cached.map(({ name, raw }) => ({
        id: generateId(),
        name,
        raw,
        loadedAt: Date.now(),
        ...parseRaw(raw, name),
      }))
      addFiles(loaded)
    }).catch(console.error)
  // Run once on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
