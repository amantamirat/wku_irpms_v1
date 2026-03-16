export enum EvalStatus {
    planned = 'planned',
    active = 'active',
    closed = 'closed'
}

export const EVAL_TRANSITIONS: Record<EvalStatus, EvalStatus[]> = {
    [EvalStatus.planned]: [EvalStatus.active],
    [EvalStatus.active]: [EvalStatus.closed, EvalStatus.planned],
    [EvalStatus.closed]: [EvalStatus.active]
};