export enum ThematicStatus {
    draft = 'draft',
    published = 'published',
    archived = 'archived'
}

export const THEMATIC_TRANSITIONS: Record<ThematicStatus, ThematicStatus[]> = {
    [ThematicStatus.draft]: [ThematicStatus.published],
    [ThematicStatus.published]: [ThematicStatus.archived, ThematicStatus.draft],
    [ThematicStatus.archived]: [ThematicStatus.published]
};