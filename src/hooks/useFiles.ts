import { useCallback } from 'react'
import { useFilesStore } from '@/stores/filesStore'
import type { LoadedFile } from '@/stores/filesStore'
import { extractChatData, detectBranches, detectFileFormat } from '@/parsers/index'

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function useFiles() {
  const { files, currentFileId, addFiles, removeFile, setCurrentFile } = useFilesStore()

  const loadFromFileObjects = useCallback(async (fileObjects: File[]) => {
    const loaded: LoadedFile[] = []

    for (const file of fileObjects) {
      try {
        const text = await file.text()
        const raw = JSON.parse(text)
        const format = detectFileFormat(raw)
        let parsed = null
        if (format !== 'unknown') {
          try {
            const extracted = extractChatData(raw, file.name)
            parsed = detectBranches(extracted)
          } catch (e) {
            console.warn(`Parse failed for ${file.name}:`, e)
          }
        }
        loaded.push({
          id: generateId(),
          name: file.name,
          raw,
          parsed,
          platform: (parsed as { platform?: string } | null)?.platform ?? format,
          loadedAt: Date.now(),
        })
      } catch (e) {
        console.error(`Failed to load ${file.name}:`, e)
      }
    }

    if (loaded.length > 0) addFiles(loaded)
    return loaded
  }, [addFiles])

  const currentFile = files.find((f) => f.id === currentFileId) ?? null

  return { files, currentFile, currentFileId, loadFromFileObjects, removeFile, setCurrentFile }
}
