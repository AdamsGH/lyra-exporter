import { api } from './client'

export interface S3File {
  name: string
  key: string
  size: number
  last_modified: string
}

export const filesApi = {
  list: () => api.get<S3File[]>('/files'),

  upload: (file: File) => {
    const fd = new FormData()
    fd.append('file', file)
    return api.postForm<{ name: string; size: number }>('/files', fd)
  },

  download: (filename: string): Promise<unknown> =>
    api.get(`/files/${encodeURIComponent(filename)}`),

  delete: (filename: string) =>
    api.delete<{ deleted: string }>(`/files/${encodeURIComponent(filename)}`),
}
