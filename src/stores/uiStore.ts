import { create } from 'zustand'

export type ViewMode = 'list' | 'timeline' | 'whiteboard'
export type Panel = 'settings' | 'cloud' | 'organize' | null

interface UiState {
  viewMode: ViewMode
  openPanel: Panel
  backendAvailable: boolean
  setViewMode: (mode: ViewMode) => void
  setOpenPanel: (panel: Panel) => void
  setBackendAvailable: (v: boolean) => void
}

export const useUiStore = create<UiState>((set) => ({
  viewMode: 'list',
  openPanel: null,
  backendAvailable: false,

  setViewMode: (mode) => set({ viewMode: mode }),
  setOpenPanel: (panel) => set((s) => ({ openPanel: s.openPanel === panel ? null : panel })),
  setBackendAvailable: (v) => set({ backendAvailable: v }),
}))
