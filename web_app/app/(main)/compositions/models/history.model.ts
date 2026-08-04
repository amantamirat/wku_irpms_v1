import { isValidRange, Range } from "./composition.model";

export type HistoryRule = {
    _id?: string;
    name: string;
    description?: string;
    submitted?: Range;
    rejected?: Range;
    completed?: Range;
    granted?: Range;
    createdAt?: string | Date;
    updatedAt?: string | Date;
};

export const validateHistoryRule = (
    rule: HistoryRule
): { valid: boolean; message?: string } => {
    if (!rule.name || rule.name.trim().length === 0) {
        return { valid: false, message: "Name is required." };
    }

    const submitted = isValidRange(rule.submitted, "Submitted");
    if (!submitted.valid) return submitted;

    const rejected = isValidRange(rule.rejected, "Rejected");
    if (!rejected.valid) return rejected;

    const completed = isValidRange(rule.completed, "Completed");
    if (!completed.valid) return completed;

    const granted = isValidRange(rule.granted, "Granted");
    if (!granted.valid) return granted;

    return { valid: true };
};

// ---------- Sanitizer ----------

export function sanitizeHistoryRule(
    rule: Partial<HistoryRule>
): Partial<HistoryRule> {
    return {
        ...rule,
    };
}