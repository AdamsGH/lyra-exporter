// Runtime configuration injected by nginx at startup via envsubst.
// Values here override DEFAULT_AI_CONFIG in src/config/aiConfig.js.
window.__LYRA_CONFIG__ = {
  ai: {
    protocol: "${LYRA_AI_PROTOCOL}",
    baseUrl: "${LYRA_AI_BASE_URL}",
    model: "${LYRA_AI_MODEL}",
    apiKey: "${LYRA_AI_API_KEY}",
    maxTokens: parseInt("${LYRA_AI_MAX_TOKENS}") || 4096
  }
};
