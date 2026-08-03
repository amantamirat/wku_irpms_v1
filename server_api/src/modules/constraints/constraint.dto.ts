export interface CreateConstraintDTO {
    name: string;
    description?: string;
    
    minParticipants?: number;
    maxParticipants?: number;

    minPhases?: number;
    maxPhases?: number;

    minBudget?: number;
    maxBudget?: number;

    minDuration?: number;
    maxDuration?: number;

    minBudgetPerPhase?: number;
    maxBudgetPerPhase?: number;

    minDurationPerPhase?: number;
    maxDurationPerPhase?: number;

    minThemes?: number;
    maxThemes?: number;

    minSubThemes?: number;
    maxSubThemes?: number;

    minFocusAreas?: number;
    maxFocusAreas?: number;

    minIndicators?: number;
    maxIndicators?: number;
}

export type UpdateConstraintDTO = Partial<CreateConstraintDTO>;