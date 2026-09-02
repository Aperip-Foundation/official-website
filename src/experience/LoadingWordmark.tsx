import { useProgress } from '@react-three/drei'
import type { JSX } from 'react'

export type LoadingWordmarkState = 'loading' | 'complete' | 'failed' | 'ready'

export interface LoadingWordmarkProps {
  loadingLabel: string
  failureLabel: string
  state: LoadingWordmarkState
}

export function LoadingWordmark({
  loadingLabel,
  failureLabel,
  state,
}: LoadingWordmarkProps): JSX.Element {
  const { progress } = useProgress()
  const label = state === 'failed' ? failureLabel : loadingLabel
  const visibleProgress = state === 'ready'
    ? 100
    : Math.min(100, Math.max(4, progress))

  return (
    <div
      className={'loading-wordmark loading-wordmark--' + state}
      data-loading-state={state}
      role={state === 'ready' ? undefined : 'status'}
      aria-label={state === 'ready' ? undefined : label}
      aria-live={state === 'ready' ? undefined : 'polite'}
      aria-hidden={state === 'ready'}
    >
      <span className="loading-wordmark__mark" aria-hidden="true">
        <svg
          className="loading-wordmark__progress"
          viewBox="0 0 120 120"
          focusable="false"
        >
          <defs>
            <linearGradient
              id="loading-progress-gradient"
              x1="12"
              y1="18"
              x2="108"
              y2="102"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0" stopColor="#71d7ff" />
              <stop offset="0.48" stopColor="#8b70ff" />
              <stop offset="1" stopColor="#ff4fa8" />
            </linearGradient>
          </defs>
          <circle
            className="loading-wordmark__track"
            cx="60"
            cy="60"
            r="49"
            pathLength="100"
          />
          <circle
            className="loading-wordmark__bar"
            cx="60"
            cy="60"
            r="49"
            pathLength="100"
            strokeDasharray="100"
            strokeDashoffset={100 - visibleProgress}
          />
        </svg>
        <img
          className="loading-wordmark__logo"
          src="/aperip-icon.svg"
          alt=""
          draggable={false}
        />
      </span>
    </div>
  )
}
