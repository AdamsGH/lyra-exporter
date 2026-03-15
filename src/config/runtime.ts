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

// Priority: VITE_ env vars (build-time) → window.__LYRA_CONFIG__ (runtime nginx) → defaults
function pick(...values: (string | undefined)[]): string {
  for (const v of values) {
    if (v && !v.startsWith('${')) return v
  }
  return ''
}

export const runtime = {
  aiProtocol:  pick(import.meta.env.VITE_AI_PROTOCOL,  window.__LYRA_CONFIG__?.AI_PROTOCOL)  || 'openai',
  aiBaseUrl:   pick(import.meta.env.VITE_AI_BASE_URL,   window.__LYRA_CONFIG__?.AI_BASE_URL)   || '',
  aiModel:     pick(import.meta.env.VITE_AI_MODEL,      window.__LYRA_CONFIG__?.AI_MODEL)      || '',
  aiApiKey:    pick(import.meta.env.VITE_AI_API_KEY,    window.__LYRA_CONFIG__?.AI_API_KEY)    || '',
  aiMaxTokens: parseInt(
    pick(import.meta.env.VITE_AI_MAX_TOKENS, window.__LYRA_CONFIG__?.AI_MAX_TOKENS) || '4096',
    10
  ),
}
