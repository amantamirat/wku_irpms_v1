export enum EvaluationStatus {
    planned = 'planned',
    active = 'active',
    closed = 'closed'
}

export const EVAL_STATUS_ORDER: EvaluationStatus[] = [
    EvaluationStatus.planned,
    EvaluationStatus.active,
    EvaluationStatus.closed
];

export const EVAL_TRANSITIONS: Record<EvaluationStatus, EvaluationStatus[]> = {
    [EvaluationStatus.planned]: [EvaluationStatus.active],
    [EvaluationStatus.active]: [EvaluationStatus.closed, EvaluationStatus.planned],
    [EvaluationStatus.closed]: [EvaluationStatus.active]
};