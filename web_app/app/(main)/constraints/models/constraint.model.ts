export type Constraint = {
    _id?: string;

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

    createdAt?: string;
    updatedAt?: string;
};


export const validateConstraint = (
    constraint: Constraint
): { valid: boolean; message?: string } => {

    if (!constraint.name || constraint.name.trim() === "") {
        return {
            valid: false,
            message: "Constraint name is required."
        };
    }


    const ranges = [
        ["Participants", constraint.minParticipants, constraint.maxParticipants],
        ["Phases", constraint.minPhases, constraint.maxPhases],
        ["Budget", constraint.minBudget, constraint.maxBudget],
        ["Duration", constraint.minDuration, constraint.maxDuration],
        ["Budget per phase", constraint.minBudgetPerPhase, constraint.maxBudgetPerPhase],
        ["Duration per phase", constraint.minDurationPerPhase, constraint.maxDurationPerPhase],
        ["Themes", constraint.minThemes, constraint.maxThemes],
        ["Sub themes", constraint.minSubThemes, constraint.maxSubThemes],
        ["Focus areas", constraint.minFocusAreas, constraint.maxFocusAreas],
        ["Indicators", constraint.minIndicators, constraint.maxIndicators],
    ];


    for (const [name, min, max] of ranges) {

        if (
            min !== undefined &&
            max !== undefined &&
            min > max
        ) {
            return {
                valid: false,
                message: `Invalid range for ${name}. Minimum cannot exceed maximum.`
            };
        }
    }

    return { valid: true };
};