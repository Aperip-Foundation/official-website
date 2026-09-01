export interface CanvasSize {
  width: number
  height: number
}

export interface LockupMetrics {
  modelAspect: number
  wordmarkWidthPerFontPixel: number
  wordmarkHeightPerFontPixel: number
}

export interface LockupLayout {
  availableWidth: number
  centerX: number
  centerY: number
  gap: number
  modelCenterX: number
  modelCenterY: number
  modelHeight: number
  modelWidth: number
  totalWidth: number
  wordmarkCenterX: number
  wordmarkCenterY: number
  wordmarkFontSize: number
  wordmarkHeight: number
  wordmarkWidth: number
}

export interface ModelTargetRect {
  centerX: number
  centerY: number
  width: number
  height: number
}

export const LOCKUP_COMPOSITION = {
  minimumWordmarkHeightRatio: 2.75 / 4,
  wordmarkHeightRatio: 2.75 / 4,
  wordmarkWidthScale: 0.8,
  lockupStart: 0.1,
  lockupSettled: 0.28,
  orbitStart: 0.78,
} as const

const DEFAULT_MODEL_ASPECT = 1
const DEFAULT_WORDMARK_WIDTH_PER_FONT_PIXEL = 3.2
const DEFAULT_WORDMARK_HEIGHT_PER_FONT_PIXEL = 0.82

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value))
}

function safePositive(value: number, fallback: number): number {
  return Number.isFinite(value) && value > 0 ? value : fallback
}

function smoothstep(value: number): number {
  const progress = clamp(value, 0, 1)
  return progress * progress * (3 - 2 * progress)
}

function interpolate(start: number, end: number, progress: number): number {
  return start + (end - start) * progress
}

function interpolateTarget(
  start: ModelTargetRect,
  end: ModelTargetRect,
  progress: number,
): ModelTargetRect {
  return {
    centerX: interpolate(start.centerX, end.centerX, progress),
    centerY: interpolate(start.centerY, end.centerY, progress),
    width: interpolate(start.width, end.width, progress),
    height: interpolate(start.height, end.height, progress),
  }
}

function centeredModelTarget(
  viewport: CanvasSize,
  modelAspect: number,
  heightCoverage: number,
  widthCoverage: number,
): ModelTargetRect {
  const width = safePositive(viewport.width, 1)
  const height = safePositive(viewport.height, 1)
  const aspect = safePositive(modelAspect, DEFAULT_MODEL_ASPECT)
  const modelHeight = Math.min(height * heightCoverage, (width * widthCoverage) / aspect)

  return {
    centerX: width / 2,
    centerY: height / 2,
    width: modelHeight * aspect,
    height: modelHeight,
  }
}

export function computeLockupLayout(
  viewport: CanvasSize,
  rawMetrics: LockupMetrics,
): LockupLayout {
  const width = safePositive(viewport.width, 1)
  const height = safePositive(viewport.height, 1)
  const modelAspect = safePositive(rawMetrics.modelAspect, DEFAULT_MODEL_ASPECT)
  const wordmarkWidthPerFontPixel = safePositive(
    rawMetrics.wordmarkWidthPerFontPixel,
    DEFAULT_WORDMARK_WIDTH_PER_FONT_PIXEL,
  )
  const wordmarkHeightPerFontPixel = safePositive(
    rawMetrics.wordmarkHeightPerFontPixel,
    DEFAULT_WORDMARK_HEIGHT_PER_FONT_PIXEL,
  )
  const canvasAspect = width / height
  const portraitWeight = clamp((1.15 - canvasAspect) / 0.55, 0, 1)
  const wideWeight = clamp((canvasAspect - 1.55) / 0.85, 0, 1)
  const widthCoverage = interpolate(0.8, 0.92, portraitWeight)
  const heightCoverage = interpolate(
    interpolate(0.46, 0.4, portraitWeight),
    0.27,
    wideWeight,
  )
  const gutter = clamp(width * 0.04, 16, 72)
  const availableWidth = Math.max(1, Math.min(width - gutter * 2, width * widthCoverage))
  const gap = clamp(Math.min(width, height) * 0.025, 10, 32)
  const wordmarkAspect = wordmarkWidthPerFontPixel / wordmarkHeightPerFontPixel
  const combinedAspect = modelAspect
    + wordmarkAspect
      * LOCKUP_COMPOSITION.wordmarkHeightRatio
      * LOCKUP_COMPOSITION.wordmarkWidthScale
  const modelHeight = Math.max(1, Math.min(
    height * heightCoverage,
    (availableWidth - gap) / combinedAspect,
  ))
  const modelWidth = modelHeight * modelAspect
  const wordmarkHeight = modelHeight * LOCKUP_COMPOSITION.wordmarkHeightRatio
  const wordmarkFontSize = wordmarkHeight / wordmarkHeightPerFontPixel
  const wordmarkWidth = wordmarkFontSize
    * wordmarkWidthPerFontPixel
    * LOCKUP_COMPOSITION.wordmarkWidthScale
  const totalWidth = modelWidth + gap + wordmarkWidth
  const centerX = width / 2
  const centerY = height / 2
  const left = centerX - totalWidth / 2

  return {
    availableWidth,
    centerX,
    centerY,
    gap,
    modelCenterX: left + modelWidth / 2,
    modelCenterY: centerY,
    modelHeight,
    modelWidth,
    totalWidth,
    wordmarkCenterX: left + modelWidth + gap + wordmarkWidth / 2,
    wordmarkCenterY: centerY,
    wordmarkFontSize,
    wordmarkHeight,
    wordmarkWidth,
  }
}

export function sampleModelTarget(
  progress: number,
  viewport: CanvasSize,
  anchor: ModelTargetRect,
  modelAspect: number,
): ModelTargetRect {
  const value = Number.isFinite(progress) ? clamp(progress, 0, 1) : 0
  const safeAnchor = anchor.width > 0 && anchor.height > 0
    ? anchor
    : centeredModelTarget(viewport, modelAspect, 0.58, 0.62)
  const hero = centeredModelTarget(viewport, modelAspect, 0.58, 0.62)
  const orbit = centeredModelTarget(viewport, modelAspect, 0.4, 0.38)

  if (value <= LOCKUP_COMPOSITION.lockupStart) return hero

  if (value < LOCKUP_COMPOSITION.lockupSettled) {
    const transition = smoothstep(
      (value - LOCKUP_COMPOSITION.lockupStart)
      / (LOCKUP_COMPOSITION.lockupSettled - LOCKUP_COMPOSITION.lockupStart),
    )
    return interpolateTarget(hero, safeAnchor, transition)
  }

  if (value < LOCKUP_COMPOSITION.orbitStart) return safeAnchor

  return interpolateTarget(
    safeAnchor,
    orbit,
    smoothstep(
      (value - LOCKUP_COMPOSITION.orbitStart)
      / (1 - LOCKUP_COMPOSITION.orbitStart),
    ),
  )
}
