export type PlatformId = 'github' | 'discord' | 'qq' | 'bilibili' | 'x'

export interface PlatformDefinition {
  id: PlatformId
  href: string
  icon: PlatformId
  labelKey: string
  ariaLabelKey: string
}

type BuildEnvironment = Record<string, string | undefined>

const buildEnvironment = import.meta.env as BuildEnvironment

function readPlatformUrl(name: string, fallback: string): string {
  // Vite exposes VITE_* variables by default. The unprefixed lookup also
  // supports a container that explicitly defines those names at build time.
  return buildEnvironment['VITE_' + name] ?? buildEnvironment[name] ?? fallback
}

export const PLATFORMS: readonly PlatformDefinition[] = [
  {
    id: 'github',
    href: readPlatformUrl('PLATFORM_GITHUB_URL', 'https://github.com/TAperip-Foundation'),
    icon: 'github',
    labelKey: 'platforms.items.github.name',
    ariaLabelKey: 'platforms.items.github.ariaLabel',
  },
  {
    id: 'discord',
    href: readPlatformUrl('PLATFORM_DISCORD_URL', 'https://discord.gg/TaNYDC6kfJ'),
    icon: 'discord',
    labelKey: 'platforms.items.discord.name',
    ariaLabelKey: 'platforms.items.discord.ariaLabel',
  },
  {
    id: 'qq',
    href: readPlatformUrl('PLATFORM_QQ_URL', 'https://pd.qq.com/s/clcwlblcm?b=5'),
    icon: 'qq',
    labelKey: 'platforms.items.qq.name',
    ariaLabelKey: 'platforms.items.qq.ariaLabel',
  },
  {
    id: 'bilibili',
    href: readPlatformUrl('PLATFORM_BILIBILI_URL', 'https://space.bilibili.com/1220845388'),
    icon: 'bilibili',
    labelKey: 'platforms.items.bilibili.name',
    ariaLabelKey: 'platforms.items.bilibili.ariaLabel',
  },
  {
    id: 'x',
    href: readPlatformUrl('PLATFORM_X_URL', 'https://x.com/TeamAPEOfficial'),
    icon: 'x',
    labelKey: 'platforms.items.x.name',
    ariaLabelKey: 'platforms.items.x.ariaLabel',
  },
] as const
