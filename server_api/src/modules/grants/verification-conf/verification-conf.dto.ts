import { VerificationConfigurationStatus } from "./verification-conf.model";

export interface CreateVerificationConfigurationDTO {
    grant: string;
    deadline: Date;
    template?: string;
    evaluation: string;
    minReviewers: number;
    maxReviewers: number;
    maxAttempts: number;
    minAcceptanceScore: number;
    status?: VerificationConfigurationStatus;
}

export interface UpdateVerificationConfigurationDTO {
    deadline?: Date;
    template?: string;
    evaluation?: string;
    minReviewers?: number;
    maxReviewers?: number;
    maxAttempts?: number;
    minAcceptanceScore?: number;
    status?: VerificationConfigurationStatus;
}


export interface FilterConfigurationDTO {
    //grant?: string;
    deadline?: Date;
    status?: VerificationConfigurationStatus;
}