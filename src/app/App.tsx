import { useCallback, useState, type JSX } from 'react'
import { Experience } from '../experience/Experience'
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
  const [sceneReady, setSceneReady] = useState(false)
  const handleSceneReady = useCallback(() => setSceneReady(true), [])

  return (
    <div className="site-shell" data-scene-ready={sceneReady}>
      <main id="app" aria-label={content.intro.name}>
        <Experience
          content={content}
          onModelReady={handleSceneReady}
          onModelFailure={handleSceneReady}
        />
      </main>
      <footer className="site-footer">
        <small className="site-footer__copyright">{content.footer.copyright}</small>
      </footer>
    </div>
  )
}
