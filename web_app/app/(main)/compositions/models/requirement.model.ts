import { EligibilityProfile } from "./profile.model";
import { isValidRange, Range } from "./composition.model";
import { HistoryRule } from "./history.model";

export enum AggregationMode {
    COUNT = "COUNT",
    RATIO = "RATIO"
}

export type MemberRequirement = {
    _id?: string;
    name: string;
    description?: string;
    profile?: string | EligibilityProfile;
    historyRule?: string | HistoryRule;
    mode: AggregationMode;
    threshold: Range;
    createdAt?: string | Date;
    updatedAt?: string | Date;
};

export const validateMemberRequirement = (
    requirement: MemberRequirement
): { valid: boolean; message?: string } => {

    if (!requirement.name || requirement.name.trim().length === 0) {
        return {
            valid: false,
            message: "Name is required.",
        };
    }

    if (!requirement.mode) {
        return {
            valid: false,
            message: "Aggregation mode is required.",
        };
    }

    if (!requirement.threshold) {
        return {
            valid: false,
            message: "Threshold is required.",
        };
    }

    const thresholdCheck = isValidRange(
        requirement.threshold,
        "Threshold"
    );

    if (!thresholdCheck.valid) {
        return thresholdCheck;
    }

    return {
        valid: true,
    };
};


// ---------- Sanitizer ----------

export function sanitizeMemberRequirement(
    requirement: Partial<MemberRequirement>
): Partial<MemberRequirement> {

    return {
        ...requirement,

        profile:
            typeof requirement.profile === "object" &&
                requirement.profile !== null
                ? requirement.profile._id
                : requirement.profile,


        historyRule:
            typeof requirement.historyRule === "object" &&
                requirement.historyRule !== null
                ? requirement.historyRule._id
                : requirement.historyRule,
    };
}