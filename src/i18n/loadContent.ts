import { parse } from 'smol-toml'
import englishSource from '../content/i18n/en.toml?raw'
import japaneseSource from '../content/i18n/ja.toml?raw'
import russianSource from '../content/i18n/ru.toml?raw'
import simplifiedChineseSource from '../content/i18n/zh-CN.toml?raw'
import traditionalChineseSource from '../content/i18n/zh-TW.toml?raw'
import type { Locale, SiteContent } from './types'

type ContentNode = string | { readonly [key: string]: ContentNode }

const contentShape = {
  meta: { title: '', description: '' },
  loading: { label: '' },
  navigation: { scrollCue: '' },
  intro: { name: '', line1: '', line2: '' },
  projects: {
    heading: '',
    repositoryLabel: '',
    externalLinkLabel: '',
    items: {
      ape: { name: '', owner: '', description: '', ariaLabel: '' },
      toolStudio: { name: '', owner: '', description: '', ariaLabel: '' },
      rhoiScribe: { name: '', owner: '', description: '', ariaLabel: '' },
      ahcl: { name: '', owner: '', description: '', ariaLabel: '' },
    },
  },
  platforms: {
    heading: '',
    items: {
      github: { name: '', ariaLabel: '' },
      discord: { name: '', ariaLabel: '' },
      qq: { name: '', ariaLabel: '' },
      bilibili: { name: '', ariaLabel: '' },
      x: { name: '', ariaLabel: '' },
    },
  },
  fallback: { modelUnavailable: '' },
} as const satisfies ContentNode

const localeSources: Record<Locale, string> = {
  en: englishSource,
  'zh-CN': simplifiedChineseSource,
  'zh-TW': traditionalChineseSource,
  ja: japaneseSource,
  ru: russianSource,
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function parseToml(source: string, label: string): Record<string, unknown> {
  try {
    const parsed = parse(source)
    if (!isRecord(parsed)) throw new Error('the root value must be a table')
    return parsed
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error)
    throw new Error(`Malformed ${label} locale content: ${detail}`, { cause: error })
  }
}

function assertEnglishShape(
  value: unknown,
  shape: ContentNode,
  path = '',
): asserts value is Record<string, unknown> {
  if (typeof shape === 'string') {
    if (typeof value !== 'string') {
      throw new Error(`Malformed English locale content: expected string at ${path}`)
    }
    return
  }

  if (!isRecord(value)) {
    throw new Error(`Malformed English locale content: expected table at ${path || 'root'}`)
  }

  const expectedKeys = Object.keys(shape)
  const actualKeys = Object.keys(value)
  const unexpectedKey = actualKeys.find((key) => !Object.hasOwn(shape, key))
  if (unexpectedKey) {
    throw new Error(`Malformed English locale content: unexpected key at ${path ? `${path}.` : ''}${unexpectedKey}`)
  }

  const missingKey = expectedKeys.find((key) => !Object.hasOwn(value, key))
  if (missingKey) {
    throw new Error(`Malformed English locale content: missing key at ${path ? `${path}.` : ''}${missingKey}`)
  }

  for (const key of expectedKeys) {
    assertEnglishShape(value[key], shape[key], path ? `${path}.${key}` : key)
  }
}

function mergeWithEnglish(
  english: Record<string, unknown>,
  localized: Record<string, unknown>,
  shape: ContentNode,
): Record<string, unknown> {
  const merged: Record<string, unknown> = {}

  for (const [key, childShape] of Object.entries(shape)) {
    const englishValue = english[key]
    const localizedValue = localized[key]
    merged[key] = typeof childShape === 'string'
      ? typeof localizedValue === 'string' ? localizedValue : englishValue
      : mergeWithEnglish(
          englishValue as Record<string, unknown>,
          isRecord(localizedValue) ? localizedValue : {},
          childShape,
        )
  }

  return merged
}

export function loadContentFromToml(
  englishToml: string,
  localizedToml: string | undefined,
  locale: Locale,
): SiteContent {
  const english = parseToml(englishToml, 'English')
  assertEnglishShape(english, contentShape)

  if (locale === 'en' || !localizedToml) {
    return mergeWithEnglish(english, {}, contentShape) as unknown as SiteContent
  }

  const localized = (() => {
    try {
      return parseToml(localizedToml, locale)
    } catch {
      return {}
    }
  })()

  return mergeWithEnglish(english, localized, contentShape) as unknown as SiteContent
}

export function loadContent(locale: Locale): SiteContent {
  return loadContentFromToml(englishSource, locale === 'en' ? undefined : localeSources[locale], locale)
}

export function applyDocumentMetadata(content: SiteContent, locale: Locale): void {
  if (typeof document === 'undefined') return

  document.documentElement.lang = locale
  document.title = content.meta.title

  let description = document.querySelector('meta[name="description"]')
  if (!description) {
    description = document.createElement('meta')
    description.setAttribute('name', 'description')
    document.head.append(description)
  }
  description.setAttribute('content', content.meta.description)
}
