export type ProjectId = 'ape' | 'toolStudio' | 'rhoiScribe' | 'ahcl'

export interface ProjectDefinition {
  id: ProjectId
  href: string
  asset: string
  titleKey: string
  ownerKey: string
  descriptionKey: string
  ariaLabelKey: string
}

// Repository metadata stays separate from translated copy so artwork and
// destinations can be replaced without changing locale files.
export const PROJECTS: readonly ProjectDefinition[] = [
  {
    id: 'ape',
    href: 'https://mod.aperip.com/',
    asset: '/assets/projects/ape-group-mark.webp',
    titleKey: 'projects.items.ape.name',
    ownerKey: 'projects.items.ape.owner',
    descriptionKey: 'projects.items.ape.description',
    ariaLabelKey: 'projects.items.ape.ariaLabel',
  },
  {
    id: 'toolStudio',
    href: 'https://www.aperip.com/?view=ape-hoi4-tool-studio#ape-hoi4-tool-studio',
    asset: '/assets/projects/tool-studio.ico',
    titleKey: 'projects.items.toolStudio.name',
    ownerKey: 'projects.items.toolStudio.owner',
    descriptionKey: 'projects.items.toolStudio.description',
    ariaLabelKey: 'projects.items.toolStudio.ariaLabel',
  },
  {
    id: 'rhoiScribe',
    href: 'https://github.com/czxieddan/RHoiScribe',
    asset: '/assets/projects/rhoiscribe.ico',
    titleKey: 'projects.items.rhoiScribe.name',
    ownerKey: 'projects.items.rhoiScribe.owner',
    descriptionKey: 'projects.items.rhoiScribe.description',
    ariaLabelKey: 'projects.items.rhoiScribe.ariaLabel',
  },
  {
    id: 'ahcl',
    href: 'https://ahcl.aperip.com/',
    asset: '/assets/projects/ahcl.svg',
    titleKey: 'projects.items.ahcl.name',
    ownerKey: 'projects.items.ahcl.owner',
    descriptionKey: 'projects.items.ahcl.description',
    ariaLabelKey: 'projects.items.ahcl.ariaLabel',
  },
] as const
