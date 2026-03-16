export enum ThematicStatus {
    planned = 'planned',
    active = 'active',
    closed = 'closed'
}

export const THEMATIC_STATUS_ORDER: ThematicStatus[] = [
    ThematicStatus.planned,
    ThematicStatus.active,
    ThematicStatus.closed
];

export const THEMATIC_TRANSITIONS: Record<ThematicStatus, ThematicStatus[]> = {
    [ThematicStatus.planned]: [ThematicStatus.active],
    [ThematicStatus.active]: [ThematicStatus.closed, ThematicStatus.planned],
    [ThematicStatus.closed]: [ThematicStatus.active]
};