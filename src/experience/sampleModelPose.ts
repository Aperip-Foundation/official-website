export interface ModelPose {
  rotation: [number, number, number]
  opacity: number
}

export const PRESENTATION_ROTATION: [number, number, number] = [
  -0.08,
  0.18,
  21.8 * Math.PI / 180,
]

function clampProgress(progress: number): number {
  if (!Number.isFinite(progress)) return 0
  return Math.min(1, Math.max(0, progress))
}

function smoothstep(progress: number): number {
  return progress * progress * (3 - 2 * progress)
}

function segmentProgress(progress: number, start: number, end: number): number {
  return smoothstep(clampProgress((progress - start) / (end - start)))
}

export function sampleModelPose(
  progress: number,
  idleRadians: number,
): ModelPose {
  const clampedProgress = clampProgress(progress)
  const idleWeight = clampedProgress < 0.1
    ? 1
    : 1 - segmentProgress(clampedProgress, 0.1, 0.22)

  return {
    rotation: [
      PRESENTATION_ROTATION[0],
      PRESENTATION_ROTATION[1] + idleRadians * idleWeight,
      PRESENTATION_ROTATION[2],
    ],
    opacity: 1,
  }
}
