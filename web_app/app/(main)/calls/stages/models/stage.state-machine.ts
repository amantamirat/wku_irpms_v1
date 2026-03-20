export enum StageStatus {
    planned = 'planned',
    active = 'active',
    closed = "closed"
}

export const STAGE_TRANSITIONS: Record<StageStatus, StageStatus[]> = {
    [StageStatus.planned]: [StageStatus.active],
    [StageStatus.active]: [StageStatus.closed, StageStatus.planned],
    [StageStatus.closed]: [StageStatus.active]
};

export const STAGE_STATUS_ORDER: StageStatus[] = [
    StageStatus.planned,
    StageStatus.active,
    StageStatus.closed
];
