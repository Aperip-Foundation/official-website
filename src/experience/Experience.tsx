import {
  createRef,
  useEffect,
  useMemo,
  useRef,
  useState,
  type JSX,
} from 'react'
import { PROJECTS } from '../content/projects'
import type { SiteContent } from '../i18n/types'
import { ModelStage } from './ModelStage'
import { PlatformOrbit } from './PlatformOrbit'
import { ProjectPassage } from './ProjectPassage'
import { useExperienceTimeline } from './useExperienceTimeline'
import { useLockupLayout } from './useLockupLayout'

export interface ExperienceProps {
  content: SiteContent
  reducedMotion?: boolean
  onModelReady?: () => void
  onModelFailure?: (error: unknown) => void
}

function useReducedMotionPreference(): boolean {
  const [reducedMotion, setReducedMotion] = useState(() => (
    typeof window !== 'undefined'
      && typeof window.matchMedia === 'function'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ))

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReducedMotion(mediaQuery.matches)
    update()
    mediaQuery.addEventListener?.('change', update)

    return () => mediaQuery.removeEventListener?.('change', update)
  }, [])

  return reducedMotion
}

export function Experience({
  content,
  reducedMotion: reducedMotionOverride,
  onModelReady,
  onModelFailure,
}: ExperienceProps): JSX.Element {
  const preferredReducedMotion = useReducedMotionPreference()
  const reducedMotion = reducedMotionOverride ?? preferredReducedMotion
  const [modelReady, setModelReady] = useState(false)
  const [modelAspect, setModelAspect] = useState(1)

  const trackRef = useRef<HTMLDivElement | null>(null)
  const stageRef = useRef<HTMLDivElement | null>(null)
  const lockupRef = useRef<HTMLDivElement | null>(null)
  const lockupMotionRef = useRef<HTMLDivElement | null>(null)
  const modelAnchorRef = useRef<HTMLDivElement | null>(null)
  const wordmarkRef = useRef<HTMLDivElement | null>(null)
  const wordmarkTextRef = useRef<HTMLHeadingElement | null>(null)
  const introductionRef = useRef<HTMLElement | null>(null)
  const orbitRootRef = useRef<HTMLElement | null>(null)
  const projectNodes = useMemo(
    () => PROJECTS.map(() => createRef<HTMLLIElement>()),
    [],
  )

  useLockupLayout({
    stageRef,
    lockupRef,
    wordmarkTextRef,
  }, modelAspect)

  useExperienceTimeline({
    trackRef,
    lockupRef,
    lockupMotionRef,
    wordmarkRef,
    introductionRef,
    projectNodes,
    orbitRootRef,
  }, reducedMotion)

  const handleModelReady = () => {
    setModelReady(true)
    onModelReady?.()
  }

  const handleModelFailure = (error: unknown) => {
    setModelReady(true)
    onModelFailure?.(error)
  }

  return (
    <div
      className={'experience' + (reducedMotion ? ' experience--reduced-motion' : '')}
      data-reduced-motion={reducedMotion}
      data-model-ready={modelReady}
    >
      <div ref={trackRef} className="experience-track" data-experience-track>
        <div ref={stageRef} className="experience-stage" data-experience-stage>
          <ModelStage
            reducedMotion={reducedMotion}
            loadingLabel={content.loading.label}
            failureLabel={content.fallback.modelUnavailable}
            modelAnchorRef={modelAnchorRef}
            onModelAspectChange={setModelAspect}
            onReady={handleModelReady}
            onFailure={handleModelFailure}
          />

          <div className="experience-overlay">
            <div
              ref={lockupRef}
              className="experience-lockup"
              data-experience-lockup
            >
              <div
                ref={lockupMotionRef}
                className="experience-lockup__motion"
              >
                <div
                  ref={modelAnchorRef}
                  className="experience-lockup__model-anchor"
                  data-model-anchor
                  aria-hidden="true"
                />
                <div
                  ref={wordmarkRef}
                  className="experience-wordmark"
                  data-experience-wordmark
                  aria-label={content.intro.name}
                >
                  <h1 ref={wordmarkTextRef}>{content.intro.name}</h1>
                </div>
              </div>
            </div>

            <p className="experience-scroll-cue" data-scroll-cue>
              {content.navigation.scrollCue}
            </p>

            <section
              ref={introductionRef}
              className="experience-introduction"
              data-experience-introduction
              aria-label={content.intro.name}
            >
              <p className="experience-introduction__body">
                {[content.intro.line1, content.intro.line2].map((line) => (
                  <span
                    className="experience-introduction__line"
                    data-introduction-line
                    key={line}
                  >
                    {line}
                  </span>
                ))}
              </p>
            </section>

            <section
              className="experience-projects"
              aria-label={content.projects.heading}
            >
              <ol className="experience-projects__list">
                {PROJECTS.map((project, index) => {
                  const item = content.projects.items[project.id]

                  return (
                    <ProjectPassage
                      ref={projectNodes[index]}
                      project={project}
                      index={index}
                      active={reducedMotion}
                      content={item}
                      key={project.id}
                    />
                  )
                })}
              </ol>
            </section>

            <PlatformOrbit
              ref={orbitRootRef}
              content={content.platforms}
              active={reducedMotion}
              reducedMotion={reducedMotion}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
