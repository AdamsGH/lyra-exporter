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
  isHydrating: boolean
  addFiles: (files: LoadedFile[]) => void
  removeFile: (id: string) => void
  renameFile: (id: string, name: string) => void
  setCurrentFile: (id: string | null) => void
  clearFiles: () => void
  setHydrated: () => void
}

export const useFilesStore = create<FilesState>((set) => ({
  files: [],
  currentFileId: null,
  isHydrating: true,

  addFiles: (newFiles) =>
    set((s) => ({
      files: [...s.files, ...newFiles],
      currentFileId: s.currentFileId ?? newFiles[0]?.id ?? null,
    })),

  removeFile: (id) =>
    set((s) => ({
      files: s.files.filter((f) => f.id !== id),
      currentFileId: s.currentFileId === id ? (s.files.find((f) => f.id !== id)?.id ?? null) : s.currentFileId,
    })),

  renameFile: (id, name) =>
    set((s) => ({
      files: s.files.map((f) => f.id === id ? { ...f, name: name + '.json' } : f),
    })),

  setCurrentFile: (id) => set({ currentFileId: id }),

  clearFiles: () => set({ files: [], currentFileId: null }),

  setHydrated: () => set({ isHydrating: false }),
}))
