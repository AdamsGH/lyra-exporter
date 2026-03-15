declare global {
  interface Window {
    __LYRA_CONFIG__?: {
      AI_PROTOCOL?: string
      AI_BASE_URL?: string
      AI_MODEL?: string
      AI_API_KEY?: string
      AI_MAX_TOKENS?: string
    }
  }
}

export const runtime = {
  aiProtocol: window.__LYRA_CONFIG__?.AI_PROTOCOL ?? 'openai',
  aiBaseUrl: window.__LYRA_CONFIG__?.AI_BASE_URL ?? '',
  aiModel: window.__LYRA_CONFIG__?.AI_MODEL ?? '',
  aiApiKey: window.__LYRA_CONFIG__?.AI_API_KEY ?? '',
  aiMaxTokens: parseInt(window.__LYRA_CONFIG__?.AI_MAX_TOKENS ?? '4096', 10),
}
