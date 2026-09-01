import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'
import { parse } from 'smol-toml'

const requiredLocales = ['en', 'zh-CN', 'zh-TW', 'ja', 'ru']

function isRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function valueType(value) {
  if (Array.isArray(value)) return 'array'
  if (value === null) return 'null'
  return typeof value
}

function placeholders(value) {
  if (typeof value !== 'string') return []
  return [...new Set([...value.matchAll(/\{([^{}]+)\}/g)].map((match) => match[1]))].sort()
}

function collectNodes(value, path = '', nodes = new Map()) {
  if (path) {
    nodes.set(path, {
      type: isRecord(value) ? 'table' : valueType(value),
      placeholders: placeholders(value),
    })
  }

  if (isRecord(value)) {
    for (const [key, child] of Object.entries(value)) {
      collectNodes(child, path ? `${path}.${key}` : key, nodes)
    }
  }

  return nodes
}

function parseLocaleSource(source, locale) {
  try {
    const parsed = parse(source)
    if (!isRecord(parsed)) throw new Error('the root value must be a table')
    return parsed
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error)
    throw new Error(`Malformed ${locale} locale content: ${detail}`)
  }
}

function sameValues(left, right) {
  return left.length === right.length && left.every((value, index) => value === right[index])
}

function validateAgainstEnglish(englishNodes, localizedNodes, locale) {
  for (const [path, english] of englishNodes) {
    const localized = localizedNodes.get(path)
    if (!localized) throw new Error(`${locale}: missing key ${path}`)
    if (localized.type !== english.type) {
      throw new Error(`${locale}: changed value type at ${path} (${english.type} to ${localized.type})`)
    }
    if (!sameValues(localized.placeholders, english.placeholders)) {
      throw new Error(`${locale}: changed placeholder set at ${path}`)
    }
  }

  for (const path of localizedNodes.keys()) {
    if (!englishNodes.has(path)) throw new Error(`${locale}: extra key ${path}`)
  }
}

export function validateLocaleDirectory(directory = resolve('src/content/i18n')) {
  const expectedFiles = new Set(requiredLocales.map((locale) => `${locale}.toml`))
  const presentFiles = new Set(readdirSync(directory).filter((file) => file.endsWith('.toml')))

  for (const expectedFile of expectedFiles) {
    if (!presentFiles.has(expectedFile)) throw new Error(`Missing locale file: ${expectedFile}`)
  }
  for (const presentFile of presentFiles) {
    if (!expectedFiles.has(presentFile)) throw new Error(`Unexpected locale file: ${presentFile}`)
  }

  const sources = Object.fromEntries(requiredLocales.map((locale) => [
    locale,
    parseLocaleSource(readFileSync(resolve(directory, `${locale}.toml`), 'utf8'), locale),
  ]))
  const englishNodes = collectNodes(sources.en)

  for (const locale of requiredLocales.filter((locale) => locale !== 'en')) {
    validateAgainstEnglish(englishNodes, collectNodes(sources[locale]), locale)
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validateLocaleDirectory(process.argv[2] ? resolve(process.argv[2]) : undefined)
  process.stdout.write('Locale validation passed.\n')
}
