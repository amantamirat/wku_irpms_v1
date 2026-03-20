export enum ThematicStatus {
    draft = 'draft',
    active = 'active',
    closed = 'closed'
}

export const THEMATIC_STATUS_ORDER: ThematicStatus[] = [
    ThematicStatus.draft,
    ThematicStatus.active,
    ThematicStatus.closed
];

export const THEMATIC_TRANSITIONS: Record<ThematicStatus, ThematicStatus[]> = {
    [ThematicStatus.draft]: [ThematicStatus.active],
    [ThematicStatus.active]: [ThematicStatus.closed, ThematicStatus.draft],
    [ThematicStatus.closed]: [ThematicStatus.active]
};