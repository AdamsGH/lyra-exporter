declare global {
  interface Window {
    __LYRA_CONFIG__?: {
      ai?: {
        protocol?: string
        baseUrl?: string
        model?: string
        apiKey?: string
        maxTokens?: number
      }
    }
  }
}

// Treat envsubst placeholders (not substituted) as absent
function valid(v: string | undefined): string | undefined {
  return v && !v.startsWith('${') ? v : undefined
}

const ai = window.__LYRA_CONFIG__?.ai ?? {}

export const runtime = {
  aiProtocol:  valid(ai.protocol)  ?? 'openai',
  aiBaseUrl:   valid(ai.baseUrl)   ?? '',
  aiModel:     valid(ai.model)     ?? '',
  aiApiKey:    valid(ai.apiKey)    ?? '',
  aiMaxTokens: (typeof ai.maxTokens === 'number' ? ai.maxTokens : null) ?? 4096,
}
