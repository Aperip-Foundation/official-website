export type Locale = 'en' | 'zh-CN' | 'zh-TW' | 'ja' | 'ru'

export interface SiteContent {
  meta: { title: string; description: string }
  loading: { label: string }
  navigation: { scrollCue: string }
  intro: { name: string; line1: string; line2: string }
  projects: {
    heading: string
    repositoryLabel: string
    items: Record<'ape' | 'toolStudio' | 'rhoiScribe' | 'ahcl', {
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
  footer: { copyright: string }
  fallback: { modelUnavailable: string }
}
