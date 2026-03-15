import { useState, useEffect, useCallback } from 'react'
import StorageManager from '../utils/storageManager'

import enTranslations from '../langs/en.json'
import zhTranslations from '../langs/zh.json'
import jaTranslations from '../langs/ja.json'
import koTranslations from '../langs/ko.json'

const STORAGE_KEY = 'language'
const DEFAULT_LANGUAGE = 'en'

const SUPPORTED_LANGUAGES: Record<string, string> = {
  en: 'English',
  zh: '中文',
  ja: '日本語',
  ko: '한국어',
}

const staticTranslations: Record<string, unknown> = {
  en: enTranslations,
  zh: zhTranslations,
  ja: jaTranslations,
  ko: koTranslations,
}

function getNestedValue(obj: unknown, key: string): string | null {
  const parts = key.split('.')
  let current: unknown = obj
  for (const part of parts) {
    if (current == null || typeof current !== 'object') return null
    current = (current as Record<string, unknown>)[part]
  }
  return typeof current === 'string' ? current : null
}

function interpolate(template: string, params: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, k) => String(params[k] ?? `{${k}}`))
}

export function getSavedLanguage(): string {
  return (StorageManager as { get: (k: string, d: string) => string }).get(STORAGE_KEY, DEFAULT_LANGUAGE)
}

export function t(key: string, params: Record<string, string | number> = {}): string {
  const language = getSavedLanguage()
  const pack = staticTranslations[language] ?? staticTranslations.en
  const translation = getNestedValue(pack, key)
  if (translation == null) {
    return interpolate(key.split('.').pop() ?? key, params)
  }
  return interpolate(translation, params)
}

export function useI18n() {
  const [currentLanguage, setCurrentLanguage] = useState(getSavedLanguage)
  const [translations, setTranslations] = useState(() => staticTranslations[getSavedLanguage()] ?? staticTranslations.en)

  useEffect(() => {
    const lang = getSavedLanguage()
    setCurrentLanguage(lang)
    setTranslations(staticTranslations[lang] ?? staticTranslations.en)
  }, [])

  const translate = useCallback((key: string, params: Record<string, string | number> = {}): string => {
    const translation = getNestedValue(translations, key)
    if (translation == null) return interpolate(key.split('.').pop() ?? key, params)
    return interpolate(translation, params)
  }, [translations])

  const changeLanguage = useCallback((lang: string) => {
    if (!SUPPORTED_LANGUAGES[lang]) return
    setCurrentLanguage(lang)
    setTranslations(staticTranslations[lang] ?? staticTranslations.en)
    ;(StorageManager as { set: (k: string, v: string) => void }).set(STORAGE_KEY, lang)
  }, [])

  return {
    t: translate,
    currentLanguage,
    changeLanguage,
    availableLanguages: SUPPORTED_LANGUAGES,
    isReady: true,
  }
}
