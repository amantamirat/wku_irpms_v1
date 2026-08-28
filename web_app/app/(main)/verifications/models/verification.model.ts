import { extractId } from "@/utils/extractId";
import { Project } from "../../projects/models/project.model";
import { VerificationConfiguration } from "../verification-conf/models/verification-conf.model";

export enum VerificationStatus {
    submitted = "submitted",
    //under_review = "under_review",
    verified = "verified",
    rejected = "rejected"
}

// Client-side API payload interface
export interface Verification {
    _id: string;
    project: string | Project;
    configuration: string | VerificationConfiguration;
    attempt: number;
    totalScore?:number;
    //submittedBy: string;
    document?: File;
    documentPath: string;
    //submittedAt?: string;
    //reviewedAt?: string;
    //remarks?: string;
    status: VerificationStatus;
    createdAt?: string;
    updatedAt?: string;
}

export interface FilterVerification {
    project?: string;
    configuration?: string;
    attempt?: number;
    status?: VerificationStatus;
}

export const sanitizeVerification = (
    verification: Partial<Verification>
): Verification => {
    return {
        ...verification,
        project: extractId(verification.project),
        configuration: extractId(verification.configuration),
    } as Verification;
};