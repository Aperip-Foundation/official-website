import type { JSX } from 'react'

export type LoadingWordmarkState = 'loading' | 'failed' | 'ready'

export interface LoadingWordmarkProps {
  wordmark: string
  loadingLabel: string
  failureLabel: string
  state: LoadingWordmarkState
}

/**
 * A small DOM-only loading/failure composition. Keeping this outside the
 * renderer means the brand remains legible while WebGL and the GLB settle.
 */
export function LoadingWordmark({
  wordmark,
  loadingLabel,
  failureLabel,
  state,
}: LoadingWordmarkProps): JSX.Element {
  const label = state === 'failed' ? failureLabel : loadingLabel

  return (
    <div
      className={'loading-wordmark loading-wordmark--' + state}
      data-loading-state={state}
      aria-live={state === 'ready' ? undefined : 'polite'}
      aria-hidden={state === 'ready'}
    >
      <span className="loading-wordmark__name">{wordmark}</span>
      <span className="loading-wordmark__label">{label}</span>
    </div>
  )
}
