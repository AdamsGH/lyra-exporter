/**
 * AI API configuration defaults.
 * Values are overridden at runtime by window.__LYRA_CONFIG__ (injected via nginx envsubst).
 * Falls back to hardcoded defaults when running without Docker.
 */

const runtimeCfg = (typeof window !== 'undefined' && window.__LYRA_CONFIG__?.ai) || {};

// Treat placeholder strings (not substituted by envsubst) as absent.
function env(val, fallback) {
  if (!val || val.startsWith('${')) return fallback;
  return val;
}

export const DEFAULT_AI_CONFIG = {
  anthropic: {
    protocol: 'anthropic',
    baseUrl: env(runtimeCfg.protocol === 'anthropic' ? runtimeCfg.baseUrl : undefined, 'https://api.anthropic.com'),
    model: env(runtimeCfg.protocol === 'anthropic' ? runtimeCfg.model : undefined, 'claude-opus-4-5-20251101'),
    maxTokens: (runtimeCfg.protocol === 'anthropic' && runtimeCfg.maxTokens) || 4096
  },
  openai: {
    protocol: 'openai',
    baseUrl: env(runtimeCfg.protocol === 'openai' ? runtimeCfg.baseUrl : undefined, 'https://api.openai.com/v1'),
    model: env(runtimeCfg.protocol === 'openai' ? runtimeCfg.model : undefined, 'gpt-4o-2024-11-20'),
    maxTokens: (runtimeCfg.protocol === 'openai' && runtimeCfg.maxTokens) || 4096
  }
};

// Inject apiKey from runtime config so the app starts pre-configured without UI input.
export const RUNTIME_API_KEY = env(runtimeCfg.apiKey, '');
export const RUNTIME_PROTOCOL = env(runtimeCfg.protocol, '');

export function getDefaultConfig(protocol = 'anthropic') {
  return DEFAULT_AI_CONFIG[protocol] || DEFAULT_AI_CONFIG.anthropic;
}

export default DEFAULT_AI_CONFIG;
