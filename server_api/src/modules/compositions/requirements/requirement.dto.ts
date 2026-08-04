import { AggregationMode } from "./requirement.model";
import { IRangeDTO } from "../composition.dto";

/**
 * Create Member Requirement
 */
export interface CreateRequirementDTO {

    name: string;

    description?: string;

    profile?: string;

    historyRule?: string;

    mode: AggregationMode;

    threshold: IRangeDTO;

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