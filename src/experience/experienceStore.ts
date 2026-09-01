export interface ExperienceStore {
  getProgress(): number
  setProgress(progress: number): void
  subscribe(listener: (progress: number) => void): () => void
}

function clampProgress(progress: number): number {
  if (!Number.isFinite(progress)) return 0
  return Math.min(1, Math.max(0, progress))
}

function createExperienceStore(): ExperienceStore {
  let progress = 0
  const listeners = new Set<(nextProgress: number) => void>()

  return {
    getProgress: () => progress,
    setProgress: (nextProgress) => {
      const clampedProgress = clampProgress(nextProgress)

      if (clampedProgress === progress) {
        return
      }

      progress = clampedProgress
      Array.from(listeners).forEach((listener) => listener(progress))
    },
    subscribe: (listener) => {
      listeners.add(listener)

      return () => {
        listeners.delete(listener)
      }
    },
  }
}

export const experienceStore = createExperienceStore()
