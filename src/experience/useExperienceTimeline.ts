import { useLayoutEffect, type RefObject } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { experienceStore } from './experienceStore'
import { EXPERIENCE_PHASES, getExperiencePhase } from './timelineState'

export interface ExperienceRefs {
  trackRef: RefObject<HTMLDivElement | null>
  lockupRef: RefObject<HTMLDivElement | null>
  lockupMotionRef: RefObject<HTMLDivElement | null>
  wordmarkRef: RefObject<HTMLDivElement | null>
  introductionRef: RefObject<HTMLElement | null>
  projectNodes: readonly RefObject<HTMLLIElement | null>[]
  orbitRootRef: RefObject<HTMLElement | null>
}

const PLATFORM_REVEAL_DELAY = 0.055
const PLATFORM_REVEAL_STEP = 0.028

type TimelineElement = HTMLElement & { inert?: boolean }

function setInteractivity(element: HTMLElement | null, visible: boolean): void {
  if (!element) return

  const node = element as TimelineElement
  node.inert = !visible
  node.setAttribute('aria-hidden', String(!visible))

  element.querySelectorAll<HTMLElement>('a, button, [tabindex]').forEach((interactive) => {
    interactive.tabIndex = visible ? 0 : -1
  })
}

function clearAnimatedStyles(elements: readonly (HTMLElement | null)[]): void {
  elements.forEach((element) => {
    if (element) gsap.set(element, { clearProps: 'all' })
  })
}

function updateSemantics(
  wordmark: HTMLElement | null,
  introduction: HTMLElement | null,
  orbitRoot: HTMLElement | null,
  progress: number,
  projectElements: readonly HTMLElement[],
  platformLinks: readonly HTMLElement[],
): void {
  const phase = getExperiencePhase(progress)
  const projectSlot = projectElements.length > 0
    ? (EXPERIENCE_PHASES.projects - EXPERIENCE_PHASES.introduction) / projectElements.length
    : 0

  setInteractivity(wordmark, phase !== 'hero' && phase !== 'orbit')
  setInteractivity(introduction, phase === 'introduction')
  setInteractivity(orbitRoot, phase === 'orbit')
  if (orbitRoot) {
    orbitRoot.dataset.platformState = phase === 'orbit' ? 'active' : 'hidden'
    orbitRoot.dataset.idleOrbit = phase === 'orbit' && progress >= 0.995
      ? 'true'
      : 'false'
  }

  const projectProgress = progress - EXPERIENCE_PHASES.introduction
  projectElements.forEach((project, index) => {
    const start = index * projectSlot
    const end = start + projectSlot
    const visible = phase === 'projects' && projectProgress >= start + 0.006 && projectProgress < end
    setInteractivity(project, visible)
  })

  platformLinks.forEach((link, index) => {
    const visible = phase === 'orbit'
      && progress >= EXPERIENCE_PHASES.projects
        + PLATFORM_REVEAL_DELAY
        + index * PLATFORM_REVEAL_STEP
        + 0.008
    link.tabIndex = visible ? 0 : -1
    link.setAttribute('aria-hidden', String(!visible))
  })
}

function setTween(target: HTMLElement | null, vars: gsap.TweenVars): void {
  if (target) gsap.set(target, vars)
}

/**
 * Maps native document scroll to one reversible GSAP timeline. React stays out
 * of the frame loop; only the mutable experience store is updated per frame.
 */
export function useExperienceTimeline(refs: ExperienceRefs, reducedMotion: boolean): void {
  const {
    trackRef,
    lockupRef,
    lockupMotionRef,
    wordmarkRef,
    introductionRef,
    projectNodes,
    orbitRootRef,
  } = refs

  useLayoutEffect(() => {
    const track = trackRef.current
    if (!track || typeof window === 'undefined') return undefined

    const lockup = lockupRef.current
    const lockupMotion = lockupMotionRef.current
    const wordmark = wordmarkRef.current
    const introduction = introductionRef.current
    const introductionLines = introduction
      ? Array.from(introduction.querySelectorAll<HTMLElement>('[data-introduction-line]'))
      : []
    const orbitRoot = orbitRootRef.current
    const projectElements = projectNodes
      .map((projectRef) => projectRef.current)
      .filter((project): project is HTMLLIElement => project !== null)
    const platformLinks = orbitRoot
      ? Array.from(orbitRoot.querySelectorAll<HTMLElement>('[data-platform-link]'))
      : []
    const scrollCue = track.querySelector<HTMLElement>('[data-scroll-cue]')
    const animatedElements = [
      lockup,
      lockupMotion,
      wordmark,
      introduction,
      ...introductionLines,
      scrollCue,
      orbitRoot,
      ...projectElements,
    ]
    const projectSlot = projectElements.length > 0
      ? (EXPERIENCE_PHASES.projects - EXPERIENCE_PHASES.introduction) / projectElements.length
      : 0

    if (reducedMotion) {
      experienceStore.setProgress(0)
      clearAnimatedStyles(animatedElements)
      setInteractivity(wordmark, true)
      setInteractivity(introduction, true)
      setInteractivity(orbitRoot, true)
      if (orbitRoot) {
        orbitRoot.dataset.platformState = 'active'
        orbitRoot.dataset.idleOrbit = 'false'
      }
      projectElements.forEach((project) => setInteractivity(project, true))
      platformLinks.forEach((link) => {
        link.tabIndex = 0
        link.removeAttribute('aria-hidden')
      })
      return undefined
    }

    gsap.registerPlugin(ScrollTrigger)

    const orbitState = { angle: -18 }
    const applyOrbitAngle = () => {
      orbitRoot?.style.setProperty('--orbit-angle', orbitState.angle + 'deg')
      orbitRoot?.style.setProperty('--orbit-counter-angle', -orbitState.angle + 'deg')
    }

    setTween(lockup, { top: '50%' })
    setTween(lockupMotion, { scale: 1 })
    setTween(wordmark, { autoAlpha: 0 })
    setTween(introduction, { autoAlpha: 1, y: 0 })
    introductionLines.forEach((line) => setTween(line, { autoAlpha: 0, y: 28 }))
    setTween(scrollCue, { autoAlpha: 1 })
    projectElements.forEach((project) => setTween(project, { autoAlpha: 0, xPercent: 0, y: 24 }))
    setTween(orbitRoot, { autoAlpha: 0, scale: 0.82 })
    platformLinks.forEach((link) => setTween(link, { autoAlpha: 0 }))
    applyOrbitAngle()

    const timeline = gsap.timeline({ paused: true, defaults: { ease: 'none' } })

    if (scrollCue) {
      timeline.to(scrollCue, {
        autoAlpha: 0,
        duration: 0.08,
        ease: 'power2.out',
      }, 0.06)
    }

    if (wordmark) {
      timeline.to(wordmark, {
        autoAlpha: 1,
        duration: EXPERIENCE_PHASES.name - EXPERIENCE_PHASES.hero,
        ease: 'power3.out',
      }, EXPERIENCE_PHASES.hero)
      timeline.to(wordmark, {
        autoAlpha: 0,
        duration: 0.15,
        ease: 'power2.in',
      }, EXPERIENCE_PHASES.projects)
    }

    if (lockup) {
      timeline.to(lockup, {
        top: '21%',
        duration: EXPERIENCE_PHASES.introduction - EXPERIENCE_PHASES.name,
        ease: 'power3.inOut',
      }, EXPERIENCE_PHASES.name)
    }

    if (lockupMotion) {
      timeline.to(lockupMotion, {
        scale: 0.78,
        duration: EXPERIENCE_PHASES.introduction - EXPERIENCE_PHASES.name,
        ease: 'power3.inOut',
      }, EXPERIENCE_PHASES.name)
    }

    if (introduction) {
      introductionLines.forEach((line, index) => {
        timeline.to(line, {
          autoAlpha: 1,
          y: 0,
          duration: 0.055,
          ease: 'power3.out',
        }, EXPERIENCE_PHASES.name + index * 0.035)
      })
      timeline.to(introduction, {
        autoAlpha: 0,
        y: -20,
        duration: 0.04,
        ease: 'power2.in',
      }, EXPERIENCE_PHASES.introduction - 0.04)
    }

    projectElements.forEach((project, index) => {
      const start = EXPERIENCE_PHASES.introduction + index * projectSlot
      const side = index % 2 === 0 ? 1 : -1

      timeline.fromTo(project,
        { autoAlpha: 0, xPercent: side * 112, y: 24 },
        {
          autoAlpha: 1,
          xPercent: 0,
          y: 0,
          duration: projectSlot * 0.34,
          ease: 'power3.out',
        },
        start,
      )
      timeline.to(project, {
        xPercent: side * -8,
        duration: projectSlot * 0.27,
        ease: 'none',
      }, start + projectSlot * 0.34)
      timeline.to(project, {
        autoAlpha: 0,
        xPercent: side * -118,
        y: -24,
        duration: projectSlot * 0.39,
        ease: 'power3.in',
      }, start + projectSlot * 0.61)
    })

    if (orbitRoot) {
      timeline.to(orbitRoot, {
        autoAlpha: 1,
        scale: 1,
        duration: 0.1,
        ease: 'power3.out',
      }, EXPERIENCE_PHASES.projects)
      timeline.to(orbitState, {
        angle: 360,
        duration: EXPERIENCE_PHASES.orbit - EXPERIENCE_PHASES.projects,
        ease: 'none',
        onUpdate: applyOrbitAngle,
      }, EXPERIENCE_PHASES.projects)
    }

    platformLinks.forEach((link, index) => {
      timeline.to(link, {
        autoAlpha: 1,
        duration: 0.05,
        ease: 'power2.out',
      }, EXPERIENCE_PHASES.projects + PLATFORM_REVEAL_DELAY + index * PLATFORM_REVEAL_STEP)
    })

    let previousPhase: ReturnType<typeof getExperiencePhase> | undefined
    const updateProgress = (progress: number) => {
      experienceStore.setProgress(progress)
      const phase = getExperiencePhase(progress)
      if (phase !== previousPhase || phase === 'projects' || phase === 'orbit') {
        previousPhase = phase
        updateSemantics(
          wordmark,
          introduction,
          orbitRoot,
          progress,
          projectElements,
          platformLinks,
        )
      }
    }

    const timelineUpdate = () => updateProgress(timeline.progress())
    timeline.eventCallback('onUpdate', timelineUpdate)

    const trigger = ScrollTrigger.create({
      animation: timeline,
      trigger: track,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.65,
      invalidateOnRefresh: true,
      onRefresh: () => updateProgress(timeline.progress()),
    })

    trigger.update()
    updateProgress(timeline.progress())
    return () => {
      trigger.kill()
      timeline.kill()
      clearAnimatedStyles(animatedElements)
      orbitRoot?.style.removeProperty('--orbit-angle')
      orbitRoot?.style.removeProperty('--orbit-counter-angle')
      if (orbitRoot) {
        orbitRoot.dataset.platformState = 'hidden'
        orbitRoot.dataset.idleOrbit = 'false'
      }
    }
  }, [
    reducedMotion,
    trackRef,
    lockupRef,
    lockupMotionRef,
    wordmarkRef,
    introductionRef,
    projectNodes,
    orbitRootRef,
  ])
}
