import { IRange } from "../../common/types/range";

/**
 * Create Constraint
 */
export interface CreateConstraintDTO {
    name: string;
    description?: string;

    titleWords?: IRange;
    summaryWords?: IRange;

    // Objectives
    generalObjectiveWords?: IRange;
    specificObjectiveWords?: IRange;
    specificObjectives?: IRange;

    // Expected Outputs
    expectedOutputs?: IRange;
    expectedOutputWords?: IRange;

    // Project structure
    participants?: IRange;
    phases?: IRange;
    budget?: IRange;
    duration?: IRange;

    activities?: IRange;
    equipments?: IRange;
    components?: IRange;

    phaseBudget?: IRange;
    phaseDuration?: IRange;

    activityDuration?: IRange;
    equipmentCost?: IRange;

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