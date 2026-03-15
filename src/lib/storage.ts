/**
 * Local persistence layer using IndexedDB via idb-keyval.
 * Files are stored as raw JSON under key `file:{name}`.
 * On startup, all cached files are restored into the files store.
 * When a new file is loaded, it is saved here and optionally to S3.
 */
import { get, set, del, keys } from 'idb-keyval'

const PREFIX = 'lyra:file:'

export async function cacheFile(name: string, raw: unknown): Promise<void> {
  await set(`${PREFIX}${name}`, raw)
}

export async function getCachedFile(name: string): Promise<unknown | null> {
  return (await get(`${PREFIX}${name}`)) ?? null
}

export async function deleteCachedFile(name: string): Promise<void> {
  await del(`${PREFIX}${name}`)
}

export async function listCachedFiles(): Promise<string[]> {
  const all = await keys()
  return (all as string[])
    .filter((k) => typeof k === 'string' && k.startsWith(PREFIX))
    .map((k) => (k as string).slice(PREFIX.length))
}

export async function getAllCachedFiles(): Promise<{ name: string; raw: unknown }[]> {
  const names = await listCachedFiles()
  const result: { name: string; raw: unknown }[] = []
  for (const name of names) {
    const raw = await getCachedFile(name)
    if (raw !== null) result.push({ name, raw })
  }
  return result
}
