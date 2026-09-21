import { IRange, isValidRange } from "@/types/range";

export enum HistoryParticipation {
    LEAD = "LEAD",
    MEMBER = "MEMBER",
    ANY = "ANY"
}

export type HistoryRule = {
    _id?: string;
    name: string;
    description?: string;

    participation?: HistoryParticipation;

    project?: {
        granted?: IRange;
        refused?: IRange;
        completed?: IRange;
    };

    application?: {
        submitted?: IRange;
        accepted?: IRange;
        rejected?: IRange;
    };

    createdAt?: string | Date;
    updatedAt?: string | Date;
};

export const validateHistoryRule = (
    rule: Partial<HistoryRule>
): { valid: boolean; message?: string } => {
    if (!rule.name || rule.name.trim().length === 0) {
        return {
            valid: false,
            message: "Name is required."
        };
    }

    const metrics: { range?: IRange; label: string }[] = [
        { range: rule.project?.granted, label: "Granted projects" },
        { range: rule.project?.refused, label: "Refused projects" },
        { range: rule.project?.completed, label: "Completed projects" },

        { range: rule.application?.submitted, label: "Submitted applications" },
        { range: rule.application?.accepted, label: "Accepted applications" },
        { range: rule.application?.rejected, label: "Rejected applications" }
    ];

    for (const metric of metrics) {
        if (metric.range && !isValidRange(metric.range)) {
            return {
                valid: false,
                message: `${metric.label} range is invalid. Ensure values are non-negative and Min is less than or equal to Max.`
            };
        }
    }

    return {
        valid: true
    };
};

