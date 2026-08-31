export interface ModelPose {
  position: [number, number, number]
  rotation: [number, number, number]
  scale: number
  opacity: number
}

export interface ViewportSize {
  width: number
  height: number
}

const PRESENTATION_ROTATION: [number, number, number] = [-0.08, 0.18, 0]
const LOCKUP_SCALE = 0.66
const PROJECT_SCALE = 0.48
const PLATFORM_SCALE = 1.05

function clampProgress(progress: number): number {
  return Math.min(1, Math.max(0, progress))
}

function smoothstep(progress: number): number {
  return progress * progress * (3 - 2 * progress)
}

function segmentProgress(progress: number, start: number, end: number): number {
  return smoothstep(clampProgress((progress - start) / (end - start)))
}

function interpolate(start: number, end: number, progress: number): number {
  return start + (end - start) * progress
}

export function sampleModelPose(
  progress: number,
  viewport: ViewportSize,
  idleRadians: number,
): ModelPose {
  const clampedProgress = clampProgress(progress)
  const leftOffset = -viewport.width * 0.2
  const upperOffset = viewport.height * 0.16

  let x = 0
  let y = 0
  let scale = 1

  if (clampedProgress < 0.36) {
    const transition = segmentProgress(clampedProgress, 0.1, 0.36)
    x = interpolate(0, leftOffset, transition)
    scale = interpolate(1, LOCKUP_SCALE, transition)
  } else if (clampedProgress < 0.48) {
    const transition = segmentProgress(clampedProgress, 0.36, 0.48)
    x = leftOffset
    y = interpolate(0, upperOffset, transition)
    scale = interpolate(LOCKUP_SCALE, PROJECT_SCALE, transition)
  } else if (clampedProgress < 0.78) {
    x = leftOffset
    y = upperOffset
    scale = PROJECT_SCALE
  } else {
    const returnPosition = segmentProgress(clampedProgress, 0.78, 1)
    const returnScale = segmentProgress(clampedProgress, 0.78, 1)
    x = interpolate(leftOffset, 0, returnPosition)
    y = interpolate(upperOffset, 0, returnPosition)
    scale = interpolate(PROJECT_SCALE, PLATFORM_SCALE, returnScale)
  }

  const idleWeight = clampedProgress < 0.1
    ? 1
    : 1 - segmentProgress(clampedProgress, 0.1, 0.36)

  return {
    position: [x, y, 0],
    rotation: [
      PRESENTATION_ROTATION[0],
      PRESENTATION_ROTATION[1] + idleRadians * idleWeight,
      PRESENTATION_ROTATION[2],
    ],
    scale,
    opacity: 1,
  }
}
