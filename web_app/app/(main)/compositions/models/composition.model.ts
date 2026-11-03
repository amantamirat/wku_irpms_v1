import { IRange } from "@/types/range";
import { IMemberRequirement } from "./requirement.model";
import { EligibilityProfile } from "./profile.model";

export enum AggregationMode {
    COUNT = "COUNT",
    RATIO = "RATIO"
}

export interface IMemberRule {
    requirement: string | IMemberRequirement;
    mode: AggregationMode;
    threshold: IRange;
}

export type Composition = {
    _id?: string;
    name: string;
    description?: string;
    leadRule?: string | IMemberRequirement;
    memberRules: IMemberRule[];
    createdAt?: string | Date;
    updatedAt?: string | Date;
};

export const validateComposition = (
    composition: Partial<Composition>
): { valid: boolean; message?: string } => {
    if (!composition.name || composition.name.trim().length === 0) {
        return {
            valid: false,
            message: "Composition name is required.",
        };
    }

    if (!composition.memberRules || composition.memberRules.length === 0) {
        return {
            valid: false,
            message: "At least one member rule is required.",
        };
    }

    for (const rule of composition.memberRules) {
        if (!rule.requirement) {
            return { valid: false, message: "All member rules must select a requirement." };
        }
        if (!rule.mode) {
            return { valid: false, message: "All member rules must have an aggregation mode." };
        }
        if (!rule.threshold || (rule.threshold.min === undefined && rule.threshold.max === undefined)) {
            return { valid: false, message: "All member rules must specify a valid threshold range." };
        }
    }

    return {
        valid: true,
    };
};