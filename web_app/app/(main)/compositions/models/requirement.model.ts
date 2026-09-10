import { EligibilityProfile } from "./profile.model";
import { HistoryRule } from "./history.model";
import { IRange, isValidRange } from "@/types/range";

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
    threshold: IRange;
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

    if (!isValidRange(requirement.threshold)) {
        return {
            valid: false,
            message: "Threshold range is invalid. Ensure values are non-negative and Min is less than or equal to Max.",
        };
    }

    return {
        valid: true,
    };
};


