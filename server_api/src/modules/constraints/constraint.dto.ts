import { IRange } from "../../common/types/range";
/**
 * Create Constraint
 */
export interface CreateConstraintDTO {
    name: string;
    description?: string;

    participants?: IRange;
    phases?: IRange;

    budget?: IRange;
    duration?: IRange;

    budgetPerPhase?: IRange;
    durationPerPhase?: IRange;

    themes?: IRange;
    subThemes?: IRange;

    focusAreas?: IRange;
    indicators?: IRange;
}

/**
 * Update Constraint
 */
export interface UpdateConstraintDTO {
    id: string;
    data: Partial<CreateConstraintDTO>;
}