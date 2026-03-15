/**
 * Lyra API client - backend persistence layer.
 * All requests go to /api/ which nginx proxies to lyra-api.
 * Auth is handled transparently via X-authentik-username header forwarded by Traefik.
 */

const BASE = '/api';

async function request(method, path, body, isFile = false) {
  const opts = {
    method,
    headers: isFile ? {} : { 'Content-Type': 'application/json' },
  };
  if (body) {
    opts.body = isFile ? body : JSON.stringify(body);
  }
  const res = await fetch(`${BASE}${path}`, opts);
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`lyra-api ${method} ${path} → ${res.status}: ${text}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

// Files
export const filesApi = {
  list: () => request('GET', '/files'),
  upload: (file) => {
    const fd = new FormData();
    fd.append('file', file);
    return request('POST', '/files', fd, true);
  },
  download: (filename) => request('GET', `/files/${encodeURIComponent(filename)}`),
  delete: (filename) => request('DELETE', `/files/${encodeURIComponent(filename)}`),
};

// Conversation meta (tags, starred, notes)
export const metaApi = {
  getAll: () => request('GET', '/meta'),
  get: (conversationId) => request('GET', `/meta/${encodeURIComponent(conversationId)}`),
  update: (conversationId, meta) => request('PUT', `/meta/${encodeURIComponent(conversationId)}`, meta),
};

// User settings
export const settingsApi = {
  get: () => request('GET', '/settings'),
  save: (settings) => request('PUT', '/settings', { settings }),
};

// Health check - used to detect if backend is available
export async function isBackendAvailable() {
  try {
    await fetch(`${BASE}/health`, { method: 'GET' });
    return true;
  } catch {
    return false;
  }
}
