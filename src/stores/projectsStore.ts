import { create } from 'zustand'
import type { Project, Account } from '@/api/projects'
import { projectsApi } from '@/api/projects'

interface ProjectsState {
  projects: Project[]
  accounts: Account[]
  loaded: boolean
  load: () => Promise<void>
  createProject: (data: Omit<Project, 'id'>) => Promise<void>
  updateProject: (id: number, data: Partial<Omit<Project, 'id'>>) => Promise<void>
  deleteProject: (id: number) => Promise<void>
  createAccount: (data: Omit<Account, 'id'>) => Promise<void>
  updateAccount: (id: number, data: Partial<Omit<Account, 'id'>>) => Promise<void>
  deleteAccount: (id: number) => Promise<void>
}

export const useProjectsStore = create<ProjectsState>((set) => ({
  projects: [],
  accounts: [],
  loaded: false,

  load: async () => {
    try {
      const [projects, accounts] = await Promise.all([
        projectsApi.listProjects(),
        projectsApi.listAccounts(),
      ])
      set({ projects, accounts, loaded: true })
    } catch {
      set({ loaded: true })
    }
  },

  createProject: async (data) => {
    const p = await projectsApi.createProject(data)
    set((s) => ({ projects: [...s.projects, p] }))
  },

  updateProject: async (id, data) => {
    const p = await projectsApi.updateProject(id, data)
    set((s) => ({ projects: s.projects.map((x) => (x.id === id ? p : x)) }))
  },

  deleteProject: async (id) => {
    await projectsApi.deleteProject(id)
    set((s) => ({ projects: s.projects.filter((x) => x.id !== id) }))
  },

  createAccount: async (data) => {
    const a = await projectsApi.createAccount(data)
    set((s) => ({ accounts: [...s.accounts, a] }))
  },

  updateAccount: async (id, data) => {
    const a = await projectsApi.updateAccount(id, data)
    set((s) => ({ accounts: s.accounts.map((x) => (x.id === id ? a : x)) }))
  },

  deleteAccount: async (id) => {
    await projectsApi.deleteAccount(id)
    set((s) => ({ accounts: s.accounts.filter((x) => x.id !== id) }))
  },
}))
