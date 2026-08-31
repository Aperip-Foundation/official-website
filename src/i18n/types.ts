export type Locale = 'en' | 'zh-CN' | 'zh-TW' | 'ja' | 'ru'

export interface SiteContent {
  meta: { title: string; description: string }
  loading: { label: string }
  navigation: { scrollCue: string }
  intro: { name: string; eyebrow: string; body: string }
  projects: {
    heading: string
    repositoryLabel: string
    externalLinkLabel: string
    items: Record<'ape' | 'toolStudio' | 'aperipNomos' | 'rhoiScribe', {
      name: string
      owner: string
      description: string
      ariaLabel: string
    }>
  }
  platforms: {
    heading: string
    items: Record<'github' | 'discord' | 'qq' | 'bilibili' | 'x', {
      name: string
      ariaLabel: string
    }>
  }
  fallback: { modelUnavailable: string }
}
