import { forwardRef, type Ref } from 'react'
import type { ProjectDefinition } from '../content/projects'

export interface ProjectCopy {
  name: string
  owner: string
  description: string
  ariaLabel: string
}

export interface ProjectPassageContent extends ProjectCopy {
  externalLinkLabel: string
}

export interface ProjectPassageProps {
  project: ProjectDefinition
  content: ProjectPassageContent
  index?: number
  active?: boolean
}

// A semantic project passage; the shared scroll timeline owns its transforms.
export const ProjectPassage = forwardRef<HTMLLIElement, ProjectPassageProps>(
  function ProjectPassage(
    { project, content, index = 0, active = false },
    ref: Ref<HTMLLIElement>,
  ) {
    return (
      <li
        ref={ref}
        className="project-passage"
        data-project-passage="true"
        data-project-id={project.id}
        data-project-index={index}
        aria-hidden={!active}
      >
        <article className="project-passage__article">
          <a
            className="project-passage__link"
            href={project.href}
            target="_blank"
            rel="noreferrer"
            aria-label={content.ariaLabel}
            tabIndex={active ? 0 : -1}
            data-project-link="true"
          >
            <figure className="project-passage__figure">
              <span className="project-passage__visual" aria-hidden="true">
                <img
                  src={project.asset}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  draggable={false}
                />
              </span>
              <figcaption className="project-passage__copy">
                <span className="project-passage__owner">{content.owner}</span>
                <h3 className="project-passage__title">{content.name}</h3>
                <p className="project-passage__description">{content.description}</p>
                <span className="project-passage__action" aria-hidden="true">
                  {content.externalLinkLabel}
                </span>
              </figcaption>
            </figure>
          </a>
        </article>
      </li>
    )
  },
)
