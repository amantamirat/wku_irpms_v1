import { AnonymizationStatus } from "../../projects/applications/application.model";
import { VerificationStatus } from "./verification.model";

export interface CreateVerificationDTO {
    project: string;
}

export interface UpdateVerificationDTO {
    anonymizedDocumentPath?: string;
    anonymizationStatus?: AnonymizationStatus;
    documentPath?: string;
}

export interface FilterVerification {
    project?: string;
    configuration?: string;
    attempt?: number;
    status?: VerificationStatus;
}