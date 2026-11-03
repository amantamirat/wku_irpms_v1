import { AggregationMode } from "./composition.model";

/**
 * Member rule reference used by a composition.
 */
export interface MemberRuleDTO {
    requirement: string;
    mode: AggregationMode;
    threshold: {
        min?: number;
        max?: number;
    };
}

/**
 * Create Composition
 */
export interface CreateCompositionDTO {
    name: string;

    description?: string;

    leadRule?: string;

    memberRules?: MemberRuleDTO[];

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