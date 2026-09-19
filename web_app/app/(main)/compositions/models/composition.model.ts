import { EligibilityProfile } from "./profile.model";
import { HistoryRuleReference } from "./history-rule-reference.model";
import { MemberRequirement } from "./requirement.model";


export type Composition = {
    _id?: string;
    name: string;

    description?: string;
    leadProfileRule?: string | EligibilityProfile;
    leadHistoryRules?: HistoryRuleReference[];
    memberRequirements?: string[] | MemberRequirement[];
    createdAt?: string | Date;
    updatedAt?: string | Date;
};


export const validateComposition = (
    composition: Composition
): { valid: boolean; message?: string } => {
    if (!composition.name || composition.name.trim().length === 0) {
        return {
            valid: false,
            message: "Name is required.",
        };
    }

    return {
        valid: true,
    };
};