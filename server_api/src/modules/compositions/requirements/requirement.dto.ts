import { HistoryContext } from "../history/history.model";

/**
 * History rule reference used by a member requirement.
 */
export interface HistoryRuleReferenceDTO {
    context: HistoryContext;
    rule: string;
}

/**
 * Create Member Requirement
 */
export interface CreateRequirementDTO {

    name: string;

    description?: string;

    profile?: string;

    historyRules?: string[];

    /*
    mode: AggregationMode;

    threshold: IRange;*/
}


/**
 * Update Member Requirement
 */
export interface UpdateRequirementDTO {

    id: string;

    data: Partial<CreateRequirementDTO>;

    userId?: string;
}