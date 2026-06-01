// project-stage.dto.ts
import { PhaseDto } from "../phase/phase.dto";
import { ApplicationStatus } from "./project.application.model";

export interface GetProjectApplicationDTO {
    project?: string;
    grantStage?: string;
    call?: string;
    status?: ApplicationStatus;
    populate?: boolean;
    skip?: number;
    limit?: number;
}

export interface CreateProjectApplicationDTO {
    project: string;
    projectTitle?: string;
    grantStage?: string;
    callStage?: string;
    stageName?: string;
    grant?: string;
    call?: string;
    documentPath: string;
    applicantId: string;
}

export interface UpdateApplicationDTO {
    id: string;
    data: Partial<{
        totalScore: number | null;
    }>;
    applicantId: string;
}

export interface UpdateApplicationStatusDTO {
    documents: string[];
    status: ApplicationStatus;
}

export interface ExistsApplicationDTO {
    grantStage?: string;
    //callStage?: string;
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

