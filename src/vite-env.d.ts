/// <reference types="vite/client" />

declare const __APP_VERSION__: string

interface ImportMetaEnv {
  readonly VITE_AI_PROTOCOL?: string
  readonly VITE_AI_BASE_URL?: string
  readonly VITE_AI_MODEL?: string
  readonly VITE_AI_API_KEY?: string
  readonly VITE_AI_MAX_TOKENS?: string
  readonly VITE_API_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
