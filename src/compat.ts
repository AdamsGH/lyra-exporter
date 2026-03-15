// Compatibility exports for legacy JS modules that import from '../App' or '../index'
import StorageManager from './utils/storageManager'

export const StorageUtils = {
  getLocalStorage(key: string, defaultValue: unknown = null) {
    const cleanKey = key.startsWith('lyra_') ? key.substring(5) : key
    return (StorageManager as { get: (k: string, d: unknown) => unknown }).get(cleanKey, defaultValue)
  },
  setLocalStorage(key: string, value: unknown) {
    const cleanKey = key.startsWith('lyra_') ? key.substring(5) : key
    return (StorageManager as { set: (k: string, v: unknown) => void }).set(cleanKey, value)
  },
}
