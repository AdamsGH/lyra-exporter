// Compatibility shim: legacy components import useI18n and t from '../index.js'
// Redirect to the new i18n module.
export { useI18n, t, getSavedLanguage } from './i18n/index.ts'

// Re-export StorageManager for legacy imports
export { default as StorageManager } from './utils/storageManager.js'
