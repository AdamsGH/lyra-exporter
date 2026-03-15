import { create } from 'zustand'

export interface LoadedFile {
  id: string
  name: string
  raw: unknown
  parsed?: unknown
  platform?: string
  loadedAt: number
}

interface FilesState {
  files: LoadedFile[]
  currentFileId: string | null
  addFiles: (files: LoadedFile[]) => void
  removeFile: (id: string) => void
  setCurrentFile: (id: string | null) => void
  clearFiles: () => void
}

export const useFilesStore = create<FilesState>((set) => ({
  files: [],
  currentFileId: null,

  addFiles: (newFiles) =>
    set((s) => ({
      files: [...s.files, ...newFiles],
      currentFileId: s.currentFileId ?? newFiles[0]?.id ?? null,
    })),

  removeFile: (id) =>
    set((s) => ({
      files: s.files.filter((f) => f.id !== id),
      currentFileId: s.currentFileId === id ? (s.files[0]?.id ?? null) : s.currentFileId,
    })),

  setCurrentFile: (id) => set({ currentFileId: id }),

  clearFiles: () => set({ files: [], currentFileId: null }),
}))
