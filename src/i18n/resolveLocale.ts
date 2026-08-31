import type { Locale } from './types'

const localeCookieName = 'aperip_locale'

function normalizeLocale(value: string | null): Locale | null {
  if (!value) return null

  const normalized = value.trim().toLowerCase()
  if (/^zh-(hant|tw|hk|mo)(-|$)/.test(normalized)) return 'zh-TW'
  if (/^zh-(hans|cn|sg)(-|$)/.test(normalized) || normalized === 'zh') return 'zh-CN'
  if (/^ja(-|$)/.test(normalized)) return 'ja'
  if (/^ru(-|$)/.test(normalized)) return 'ru'
  if (/^en(-|$)/.test(normalized)) return 'en'

  return null
}

export function resolveLocale(
  cookieLocale: string | null,
  browserLanguages: readonly string[],
): Locale {
  const cookieMatch = normalizeLocale(cookieLocale)
  if (cookieMatch) return cookieMatch

  for (const browserLanguage of browserLanguages) {
    const match = normalizeLocale(browserLanguage)
    if (match) return match
  }

  return 'en'
}

export function readLocaleCookie(
  cookieHeader = typeof document === 'undefined' ? '' : document.cookie,
): string | null {
  for (const cookie of cookieHeader.split(';')) {
    const [name, ...valueParts] = cookie.trim().split('=')
    if (name !== localeCookieName) continue

    const value = valueParts.join('=')
    try {
      return decodeURIComponent(value)
    } catch {
      return value
    }
  }

  return null
}

export function persistLocale(locale: Locale): void {
  const secure = globalThis.location?.protocol === 'https:' ? '; Secure' : ''
  document.cookie = `${localeCookieName}=${encodeURIComponent(locale)}; Max-Age=31536000; Path=/; SameSite=Lax${secure}`
}
