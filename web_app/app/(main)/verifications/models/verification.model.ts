import { Project } from "../../projects/models/project.model";

export enum VerificationStatus {
    submitted = "submitted",
    under_review = "under_review",
    verified = "verified",
    failed = "failed"
}

// Client-side API payload interface
export interface Verification {
    _id: string;
    project: string | Project;
    configuration: string;
    attempt: number;
    status: VerificationStatus;
    submittedBy: string;
    document?: File;
    documentPath: string;
    submittedAt?: string;
    reviewedAt?: string;
    remarks?: string;
    createdAt?: string;
    updatedAt?: string;
}