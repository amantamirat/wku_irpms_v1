export enum GrantStatus {
    planned = 'planned',
    active = 'active',
    closed = "closed"
}

export const GRANT_STATUS_ORDER: GrantStatus[] = [
    GrantStatus.planned,
    GrantStatus.active,
    GrantStatus.closed
];

export const GRANT_TRANSITIONS: Record<GrantStatus, GrantStatus[]> = {
    [GrantStatus.planned]: [GrantStatus.active],
    [GrantStatus.active]: [GrantStatus.closed, GrantStatus.planned],
    [GrantStatus.closed]: [GrantStatus.active]
};