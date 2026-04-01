export enum CallStageStatus {
    planned = 'planned',
    active = 'active',
    closed = "closed"
}

export const CALL_STAGE_TRANSITIONS: Record<CallStageStatus, CallStageStatus[]> = {
    [CallStageStatus.planned]: [CallStageStatus.active],
    [CallStageStatus.active]: [CallStageStatus.closed, CallStageStatus.planned],
    [CallStageStatus.closed]: [CallStageStatus.active]
};

export const CALL_STAGE_STATUS_ORDER: CallStageStatus[] = [
    CallStageStatus.planned,
    CallStageStatus.active,
    CallStageStatus.closed
];
