export enum EvalStatus {
    draft = 'draft',
    published = 'published',
    archived = 'archived'
}

export const EVAL_TRANSITIONS: Record<EvalStatus, EvalStatus[]> = {
    [EvalStatus.draft]: [EvalStatus.published],
    [EvalStatus.published]: [EvalStatus.archived, EvalStatus.draft],
    [EvalStatus.archived]: [EvalStatus.published]
};