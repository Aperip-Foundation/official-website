import { forwardRef, type CSSProperties, type Ref } from 'react'
import {
  SiBilibili,
  SiDiscord,
  SiGithub,
  SiQq,
  SiX,
} from '@icons-pack/react-simple-icons'
import { PLATFORMS, type PlatformId } from '../content/platforms'

export interface PlatformCopy {
  name: string
  ariaLabel: string
}

export interface PlatformOrbitContent {
  heading: string
  items: Record<PlatformId, PlatformCopy>
}

export interface PlatformOrbitProps {
  content: PlatformOrbitContent
  active?: boolean
  reducedMotion?: boolean
}

type PlatformIcon = typeof SiGithub

const PLATFORM_ICONS: Record<PlatformId, PlatformIcon> = {
  github: SiGithub,
  discord: SiDiscord,
  qq: SiQq,
  bilibili: SiBilibili,
  x: SiX,
}

/**
 * Real DOM links arranged around the persistent canvas mark. The timeline
 * controls the --orbit-angle custom property; a slow CSS idle turn is optional.
 */
export const PlatformOrbit = forwardRef<HTMLElement, PlatformOrbitProps>(
  function PlatformOrbit(
    { content, active = false, reducedMotion = false },
    ref: Ref<HTMLElement>,
  ) {
    return (
      <section
        ref={ref}
        className={'platform-orbit' + (reducedMotion ? ' platform-orbit--static' : '')}
        data-platform-orbit="true"
        data-platform-state={active ? 'active' : 'hidden'}
        data-idle-orbit="false"
        aria-hidden={!active}
        aria-labelledby="platform-orbit-heading"
      >
        <h2 className="platform-orbit__heading" id="platform-orbit-heading">
          {content.heading}
        </h2>
        <div className="platform-orbit__field">
          <div className="platform-orbit__idle">
            <div className="platform-orbit__rotation" data-orbit-rotation="true">
              <ul className="platform-orbit__list" role="list">
                {PLATFORMS.map((platform, index) => {
                  const Icon = PLATFORM_ICONS[platform.icon]
                  const item = content.items[platform.id]
                  return (
                    <li
                      className="platform-orbit__item"
                      data-platform-item={platform.id}
                      data-platform-index={index}
                      key={platform.id}
                      style={{
                        '--platform-index': index,
                        '--platform-angle': index * 72 + 'deg',
                        '--platform-counter-angle': index * -72 + 'deg',
                      } as CSSProperties}
                    >
                      <a
                        className="platform-orbit__link"
                        href={platform.href}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={item.ariaLabel}
                        tabIndex={active ? 0 : -1}
                        data-platform-link={platform.id}
                      >
                        <Icon aria-hidden="true" focusable="false" />
                      </a>
                    </li>
                  )
                })}
              </ul>
            </div>
          </div>
        </div>
      </section>
    )
  },
)
