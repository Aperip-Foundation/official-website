export const EXPERIENCE_PHASES = {
  hero: 0.1,
  name: 0.36,
  introduction: 0.48,
  projects: 0.78,
  orbit: 1,
} as const

export type ExperiencePhase = 'hero' | 'name' | 'introduction' | 'projects' | 'orbit'

const PROJECT_COUNT = 4

export interface ProjectPassageSample {
  xPercent: number
  opacity: number
  active: boolean
}

function clamp(value: number): number {
  return Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0
}

function smoothstep(value: number): number {
  const progress = Math.min(1, Math.max(0, value))
  return progress * progress * (3 - 2 * progress)
}

export function getExperiencePhase(progress: number): ExperiencePhase {
  const value = clamp(progress)
  if (value < EXPERIENCE_PHASES.hero) return 'hero'
  if (value < EXPERIENCE_PHASES.name) return 'name'
  if (value < EXPERIENCE_PHASES.introduction) return 'introduction'
  if (value < EXPERIENCE_PHASES.projects) return 'projects'
  return 'orbit'
}

/** Returns the reversible horizontal movement and semantic visibility of one project slot. */
export function sampleProjectPassage(
  progress: number,
  index: number,
  count = PROJECT_COUNT,
): ProjectPassageSample {
  const safeCount = Math.max(1, Math.floor(count))
  const slot = (EXPERIENCE_PHASES.projects - EXPERIENCE_PHASES.introduction) / safeCount
  const start = EXPERIENCE_PHASES.introduction + Math.max(0, index) * slot
  const local = (clamp(progress) - start) / slot
  const side = index % 2 === 0 ? 1 : -1

  if (local <= 0) return { xPercent: side * 112, opacity: 0, active: false }
  if (local >= 1) return { xPercent: side * -118, opacity: 0, active: false }

  const active = local >= 0.006 && local < 1
  if (local < 0.34) {
    const entrance = smoothstep(local / 0.34)
    return { xPercent: side * (112 * (1 - entrance)), opacity: entrance, active }
  }

  if (local < 0.61) {
    const hold = (local - 0.34) / 0.27
    return { xPercent: side * (-8 * smoothstep(hold)), opacity: 1, active }
  }

  const exit = smoothstep((local - 0.61) / 0.39)
  return { xPercent: side * (-8 - 110 * exit), opacity: 1 - exit, active }
}
