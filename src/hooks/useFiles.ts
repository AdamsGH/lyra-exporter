import { useCallback } from 'react'
import { useFilesStore } from '@/stores/filesStore'
import type { LoadedFile } from '@/stores/filesStore'

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
        loaded.push({
          id: generateId(),
          name: file.name,
          raw,
          loadedAt: Date.now(),
        })
      } catch (e) {
        console.error(`Failed to parse ${file.name}:`, e)
      }
    }

    if (loaded.length > 0) {
      addFiles(loaded)
    }
    return loaded
  }, [addFiles])

  const currentFile = files.find((f) => f.id === currentFileId) ?? null

  return {
    files,
    currentFile,
    currentFileId,
    loadFromFileObjects,
    removeFile,
    setCurrentFile,
  }
}
