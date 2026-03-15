export declare class PostMessageHandler {
  constructor(
    fileActions: { loadFiles: (files: File[]) => void },
    setError: (error: string | null) => void
  )
  setup(): () => void
  handleMessage(event: MessageEvent): void
}
