import { api } from './client'

export interface Project {
  id: number
  name: string
  color: string
  description: string
}

export interface Account {
  id: number
  name: string
  platform: string
  notes: string
}

export const projectsApi = {
  listProjects: () => api.get<Project[]>('/projects'),
  createProject: (data: Omit<Project, 'id'>) => api.post<Project>('/projects', data),
  updateProject: (id: number, data: Partial<Omit<Project, 'id'>>) => api.put<Project>(`/projects/${id}`, data),
  deleteProject: (id: number) => api.delete<{ deleted: number }>(`/projects/${id}`),

  listAccounts: () => api.get<Account[]>('/accounts'),
  createAccount: (data: Omit<Account, 'id'>) => api.post<Account>('/accounts', data),
  updateAccount: (id: number, data: Partial<Omit<Account, 'id'>>) => api.put<Account>(`/accounts/${id}`, data),
  deleteAccount: (id: number) => api.delete<{ deleted: number }>(`/accounts/${id}`),
}
