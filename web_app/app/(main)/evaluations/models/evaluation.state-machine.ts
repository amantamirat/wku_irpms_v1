export enum EvaluationStatus {
    draft = 'draft',
    published = 'published',
    archived = 'archived'
}

export const EVAL_STATUS_ORDER: EvaluationStatus[] = [
    EvaluationStatus.draft,
    EvaluationStatus.published,
    EvaluationStatus.archived
];

export const EVAL_TRANSITIONS: Record<EvaluationStatus, EvaluationStatus[]> = {
    [EvaluationStatus.draft]: [EvaluationStatus.published],
    [EvaluationStatus.published]: [EvaluationStatus.archived, EvaluationStatus.draft],
    [EvaluationStatus.archived]: [EvaluationStatus.published]
};