import { useState, type JSX } from 'react'
import { applyDocumentMetadata, loadContent } from '../i18n/loadContent'
import { persistLocale, readLocaleCookie, resolveLocale } from '../i18n/resolveLocale'

function initializeContent() {
  const locale = resolveLocale(
    readLocaleCookie(document.cookie),
    navigator.languages,
  )
  const content = loadContent(locale)

  persistLocale(locale)
  applyDocumentMetadata(content, locale)

  return content
}

export function App(): JSX.Element {
  const [content] = useState(initializeContent)

  return <main id="app" aria-label={content.intro.name} />
}
