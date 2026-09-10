import { IRange, isValidRange } from "@/types/range";

export type HistoryRule = {
    _id?: string;
    name: string;
    description?: string;
    submitted?: IRange;
    rejected?: IRange;
    completed?: IRange;
    granted?: IRange;
    createdAt?: string | Date;
    updatedAt?: string | Date;
};

export const validateHistoryRule = (
    rule: HistoryRule
): { valid: boolean; message?: string } => {
    if (!rule.name || rule.name.trim().length === 0) {
        return { valid: false, message: "Name is required." };
    }

    const metrics: { range?: IRange; label: string }[] = [
        { range: rule.submitted, label: "Submitted" },
        { range: rule.rejected, label: "Rejected" },
        { range: rule.completed, label: "Completed" },
        { range: rule.granted, label: "Granted" }
    ];

    for (const metric of metrics) {
        if (metric.range && !isValidRange(metric.range)) {
            return {
                valid: false,
                message: `${metric.label} range is invalid. Ensure values are non-negative and Min is less than or equal to Max.`
            };
        }
    }

    return { valid: true };
};