// project-stage.dto.ts
import { PhaseDto } from "../phase/phase.dto";
import { ApplicationStatus } from "./application.model";

export interface GetApplicationDTO {
    project?: string;
    stage?: string;
    call?: string;
    status?: ApplicationStatus;
    populate?: boolean;
    skip?: number;
    limit?: number;
}

export interface CreateApplicationDTO {
    project: string;
    stage: string;
    documentPath: string;
    userId: string;
}

export interface UpdateApplicationDTO {
    id: string;
    data: Partial<{
        totalScore: number | null;
    }>;
    userId: string;
}

export interface UpdateApplicationStatusDTO {
    documents: string[];
    status: ApplicationStatus;
}

export interface ExistsApplicationDTO {
    stage?: string;
    project?: string;
}

export interface SubmitProjectDTO {
    call: string;
    title: string;
    summary?: string;
    applicant: string;
    collaborators: string[];
    phases: PhaseDto[];
    themes: string[];
    documentPath: string;
}

export interface FindByIdOptions {
    populate?: {
        project?: boolean;
        grantStage?: boolean;
    };
}

