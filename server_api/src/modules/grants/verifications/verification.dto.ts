import { VerificationStatus } from "./verification.model";

export interface CreateVerificationDTO {
    project: string;
}

export interface UpdateVerificationDTO {
    documentPath?: string;
}

export interface FilterVerification {
    project?: string;
    configuration?: string;
    attempt?: number;
    status?: VerificationStatus;
}