import { useEffect } from 'react'
import { PostMessageHandler } from '@/utils/data/postMessageHandler'
import { useFiles } from '@/hooks/useFiles'

export function usePostMessage() {
  const { loadFromFileObjects } = useFiles()

  useEffect(() => {
    // Adapter: PostMessageHandler calls fileActions.loadFiles([File])
    const fileActions = {
      loadFiles: (fileList: File[]) => {
        loadFromFileObjects(fileList).catch((err) =>
          console.error('[PostMessage] loadFiles failed:', err)
        )
      },
    }

    const handler = new PostMessageHandler(
      fileActions,
      (error: string | null) => { if (error) console.error('[PostMessage]', error) }
    )
    const cleanup = handler.setup()
    return () => {
      if (typeof cleanup === 'function') cleanup()
    }
  // loadFromFileObjects is stable (from useFiles)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
