import { IRange, isValidRange } from "@/types/range";
import { ProjectStatus } from "../../projects/models/project.model";

export enum HistoryContext {
    CALL = "CALL",
    ORGANIZATION = "ORGANIZATION",
    CALENDAR = "CALENDAR",
    SOURCE = "SOURCE",
}

export enum HistoryParticipation {
    LEAD = "LEAD",
    MEMBER = "MEMBER",
    ANY = "ANY"
}


export interface IHistoryRule {
    _id?: string;
    name: string;
    description?: string;
    context: HistoryContext;
    participation: HistoryParticipation;
    metrics: ProjectStatus[];
    sumRange: IRange;
    createdAt?: string | Date;
    updatedAt?: string | Date;
}

export const validateHistoryRule = (rule: Partial<IHistoryRule>) => {
    if (!rule.name?.trim()) return { valid: false, message: 'Rule name is required.' };
    if (!rule.context) return { valid: false, message: 'Context is required.' };
    if (!rule.participation) return { valid: false, message: 'Participation is required.' };
    if (!rule.metrics || rule.metrics.length === 0) return { valid: false, message: 'At least one metric must be selected.' };
    if (!rule.sumRange || (rule.sumRange.min === undefined && rule.sumRange.max === undefined)) {
        return { valid: false, message: 'Sum range requires at least a minimum or maximum bound.' };
    }
    return { valid: true };
};