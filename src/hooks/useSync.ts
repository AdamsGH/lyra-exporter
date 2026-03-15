import { useEffect, useState, useCallback } from 'react'
import { filesApi } from '@/api/files'
import type { S3File } from '@/api/files'
import { useUiStore } from '@/stores/uiStore'
import { useMetaStore } from '@/stores/metaStore'
import { useProjectsStore } from '@/stores/projectsStore'
import { checkBackend } from '@/api/client'

export function useSync() {
  const { backendAvailable, setBackendAvailable } = useUiStore()
  const { load: loadMeta } = useMetaStore()
  const { load: loadProjects } = useProjectsStore()
  const [s3Files, setS3Files] = useState<S3File[]>([])
  const [s3Loading, setS3Loading] = useState(false)

  // Check backend once on mount
  useEffect(() => {
    checkBackend().then((ok) => {
      setBackendAvailable(ok)
    })
  }, [setBackendAvailable])

  // Load meta + projects when backend becomes available
  useEffect(() => {
    if (!backendAvailable) return
    loadMeta()
    loadProjects()
  }, [backendAvailable, loadMeta, loadProjects])

  const refreshS3Files = useCallback(async () => {
    if (!backendAvailable) return
    setS3Loading(true)
    try {
      const files = await filesApi.list()
      setS3Files(files)
    } catch (e) {
      console.error('S3 list failed:', e)
    } finally {
      setS3Loading(false)
    }
  }, [backendAvailable])

  useEffect(() => {
    if (backendAvailable) refreshS3Files()
  }, [backendAvailable, refreshS3Files])

  const uploadToS3 = useCallback(async (file: File) => {
    await filesApi.upload(file)
    await refreshS3Files()
  }, [refreshS3Files])

  const deleteFromS3 = useCallback(async (filename: string) => {
    await filesApi.delete(filename)
    await refreshS3Files()
  }, [refreshS3Files])

  const downloadFromS3 = useCallback(async (filename: string): Promise<File> => {
    const data = await filesApi.download(filename)
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' })
    return new File([blob], filename, { type: 'application/json' })
  }, [])

  return {
    backendAvailable,
    s3Files,
    s3Loading,
    refreshS3Files,
    uploadToS3,
    deleteFromS3,
    downloadFromS3,
  }
}
