import { IRange } from "../../../common/types/range";
import { AggregationMode } from "./requirement.model";

/**
 * Create Member Requirement
 */
export interface CreateRequirementDTO {

    name: string;

    description?: string;

    profile?: string;

    historyRule?: string;

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