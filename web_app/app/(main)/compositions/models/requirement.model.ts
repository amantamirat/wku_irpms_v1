

import { IHistoryRule } from "./history.model";     // adjust path as needed
import { EligibilityProfile } from './profile.model';

export interface IMemberRequirement {
    _id?: string;
    name: string;
    description?: string;
    profile?: string | EligibilityProfile;
    historyRules: (string | IHistoryRule)[];
    createdAt?: string | Date;
    updatedAt?: string | Date;
}

export const validateMemberRequirement = (
    requirement: Partial<IMemberRequirement>
): { valid: boolean; message?: string } => {

    if (!requirement.name || requirement.name.trim().length === 0) {
        return {
            valid: false,
            message: "Name is required.",
        };
    }

    if (!requirement.historyRules || requirement.historyRules.length === 0) {
        return {
            valid: false,
            message: "At least one history rule is required.",
        };
    }

    return {
        valid: true,
    };
};