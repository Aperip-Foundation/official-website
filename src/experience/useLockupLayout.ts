import { useLayoutEffect, type RefObject } from 'react'
import { computeLockupLayout } from './lockupLayout'

export interface LockupLayoutRefs {
  stageRef: RefObject<HTMLDivElement | null>
  lockupRef: RefObject<HTMLDivElement | null>
  wordmarkTextRef: RefObject<HTMLHeadingElement | null>
}

function px(value: number): string {
  return Math.round(value * 100) / 100 + 'px'
}

function readCanvasSize(stage: HTMLDivElement): { width: number; height: number } {
  const canvas = stage.querySelector<HTMLCanvasElement>('canvas')
  const rect = (canvas ?? stage).getBoundingClientRect()

  return {
    width: Math.max(1, rect.width || stage.clientWidth),
    height: Math.max(1, rect.height || stage.clientHeight),
  }
}

/** Measures the rendered font and writes the solver output as lockup CSS variables. */
export function useLockupLayout(
  refs: LockupLayoutRefs,
  modelAspect: number,
): void {
  const { stageRef, lockupRef, wordmarkTextRef } = refs

  useLayoutEffect(() => {
    const stage = stageRef.current
    const lockup = lockupRef.current
    const wordmark = wordmarkTextRef.current
    if (!stage || !lockup || !wordmark || typeof window === 'undefined') return undefined

    let frame = 0
    let disposed = false

    const measure = () => {
      frame = 0
      if (disposed) return

      const viewport = readCanvasSize(stage)
      const fontSize = Number.parseFloat(window.getComputedStyle(wordmark).fontSize)
      if (!Number.isFinite(fontSize) || fontSize <= 0) return

      const layout = computeLockupLayout(viewport, {
        modelAspect,
        wordmarkWidthPerFontPixel: Math.max(1, wordmark.offsetWidth) / fontSize,
        wordmarkHeightPerFontPixel: Math.max(1, wordmark.offsetHeight) / fontSize,
      })

      lockup.style.setProperty('--model-anchor-width', px(layout.modelWidth))
      lockup.style.setProperty('--model-anchor-height', px(layout.modelHeight))
      lockup.style.setProperty('--lockup-gap', px(layout.gap))
      lockup.style.setProperty('--wordmark-width', px(layout.wordmarkWidth))

      const currentFontSize = Number.parseFloat(
        lockup.style.getPropertyValue('--wordmark-font-size'),
      )
      if (!Number.isFinite(currentFontSize)
        || Math.abs(currentFontSize - layout.wordmarkFontSize) > 0.25) {
        lockup.style.setProperty('--wordmark-font-size', px(layout.wordmarkFontSize))
      }
    }

    const scheduleMeasure = () => {
      if (disposed || frame !== 0) return
      frame = window.requestAnimationFrame(measure)
    }

    const resizeObserver = typeof ResizeObserver === 'undefined'
      ? null
      : new ResizeObserver(scheduleMeasure)
    resizeObserver?.observe(stage)
    resizeObserver?.observe(wordmark)

    const canvas = stage.querySelector<HTMLCanvasElement>('canvas')
    if (canvas) resizeObserver?.observe(canvas)

    window.addEventListener('resize', scheduleMeasure)
    window.visualViewport?.addEventListener('resize', scheduleMeasure)
    document.fonts.addEventListener?.('loadingdone', scheduleMeasure)
    void document.fonts.ready.then(scheduleMeasure)
    scheduleMeasure()

    return () => {
      disposed = true
      if (frame !== 0) window.cancelAnimationFrame(frame)
      resizeObserver?.disconnect()
      window.removeEventListener('resize', scheduleMeasure)
      window.visualViewport?.removeEventListener('resize', scheduleMeasure)
      document.fonts.removeEventListener?.('loadingdone', scheduleMeasure)
    }
  }, [lockupRef, modelAspect, stageRef, wordmarkTextRef])
}
