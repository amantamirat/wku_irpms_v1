import { IRange } from "../../../common/types/range";
import { AggregationMode } from "./requirement.model";
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

    historyRules?: HistoryRuleReferenceDTO[];

    mode: AggregationMode;

    threshold: IRange;

    userId?: string;
}


/**
 * Update Member Requirement
 */
export interface UpdateRequirementDTO {

    id: string;

    data: Partial<CreateRequirementDTO>;

    userId?: string;
}