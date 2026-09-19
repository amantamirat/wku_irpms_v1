import { HistoryContext } from "./history/history.model";

/**
 * History rule reference used by a composition.
 */
export interface HistoryRuleReferenceDTO {
    context: HistoryContext;
    rule: string;
}

/**
 * Create Composition
 */
export interface CreateCompositionDTO {

    name: string;

    description?: string;

    leadProfileRule?: string;

    leadHistoryRules?: HistoryRuleReferenceDTO[];

    memberRequirements?: string[];

    userId?: string;
}


/**
 * Update Composition
 */
export interface UpdateCompositionDTO {

    id: string;

    data: Partial<CreateCompositionDTO>;

    userId?: string;
}