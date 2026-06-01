// project-stage.dto.ts
import { PhaseDto } from "../phase/phase.dto";
import { ProjectStageStatus } from "./project.stage.model";

export interface GetProjectStageDTO {
    project?: string;
    grantStage?: string;
    call?: string;
    //grantAllocation?: string;
    //callStage?: string;
    status?: ProjectStageStatus;
    populate?: boolean;
    skip?: number;
    limit?: number;
}

export interface CreateProjectStageDTO {
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

export interface UpdateStageDTO {
    id: string;
    data: Partial<{
        //status: ProjectStageStatus;
        totalScore: number | null;
    }>;
    applicantId: string;
}

export interface UpdateStatusDTO {
    documents: string[];
    status: ProjectStageStatus;
}

export interface ExistsStageDTO {
    grantStage?: string;
    callStage?: string;
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

