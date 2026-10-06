import { IRange, isValidRange } from "@/types/range";

export enum HistoryParticipation {
    LEAD = "LEAD",
    MEMBER = "MEMBER",
    ANY = "ANY"
}

export enum HistoryMetric {
    PROJECT_GRANTED = "project.granted",
    PROJECT_REFUSED = "project.refused",
    PROJECT_COMPLETED = "project.completed",
    PROJECT_VERIFIED = "project.verified",

    APPLICATION_SUBMITTED = "application.submitted",
    APPLICATION_ACCEPTED = "application.accepted",
    APPLICATION_REJECTED = "application.rejected",
    /*
        VERIFICATION_SUBMITTED = "verification.submitted",
        VERIFICATION_VERIFIED = "verification.verified",
        VERIFICATION_REJECTED = "verification.rejected"*/
}

export interface IHistoryRuleTotal {
    fields: HistoryMetric[];
    range: IRange;
}

export type HistoryRule = {
    _id?: string;
    name: string;
    description?: string;

    participation?: HistoryParticipation;

    /*
    project?: {
        granted?: IRange;
        refused?: IRange;
        completed?: IRange;
        verified?: IRange;
    };

    application?: {
        submitted?: IRange;
        accepted?: IRange;
        rejected?: IRange;
    };

    verification?: {
        submitted?: IRange;
        verified?: IRange;
        rejected?: IRange;
    };
*/
    total?: IHistoryRuleTotal;

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
    /*
        const metrics: { range?: IRange; label: string }[] = [
            
            { range: rule.project?.granted, label: "Granted projects" },
            { range: rule.project?.refused, label: "Refused projects" },
            { range: rule.project?.completed, label: "Completed projects" },
            { range: rule.project?.verified, label: "Verified projects" },
    
            { range: rule.application?.submitted, label: "Submitted applications" },
            { range: rule.application?.accepted, label: "Accepted applications" },
            { range: rule.application?.rejected, label: "Rejected applications" },
    
            { range: rule.verification?.submitted, label: "Submitted verifications" },
            { range: rule.verification?.verified, label: "Verified verifications" },
            { range: rule.verification?.rejected, label: "Rejected verifications" }
        ];
    
        for (const metric of metrics) {
            if (metric.range && !isValidRange(metric.range)) {
                return {
                    valid: false,
                    message: `${metric.label} range is invalid. Ensure values are non-negative and Min is less than or equal to Max.`
                };
            }
        }
        */

    if (rule.total) {
        if (rule.total.range && !isValidRange(rule.total.range)) {
            return {
                valid: false,
                message: "Total range is invalid. Ensure values are non-negative and Min is less than or equal to Max."
            };
        }
    }

    return {
        valid: true
    };
};