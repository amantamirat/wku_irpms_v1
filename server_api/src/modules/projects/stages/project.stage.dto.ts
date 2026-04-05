// project-stage.dto.ts
import { PhaseDto } from "../phase/phase.dto";
import { ProjectStageStatus } from "./project.stage.status";

export interface GetProjectStageDTO {
    project?: string;
    grantStage?: string;
    grantAllocation?: string;
    callStage?: string;
    status?: ProjectStageStatus;
    populate?: boolean;
    skip?: number;
    limit?: number;
}

export interface CreateProjectStageDTO {
    project: string;
    grantStage?: string;
    documentPath: string;
    applicantId: string;
}

export interface UpdateStageDTO {
    id: string;
    data: Partial<{
        //status: ProjectStageStatus;
        totalScore: number;
    }>;
    applicantId: string;
}

export interface UpdateStatusDTO {
    documents: string[];
    status: ProjectStageStatus;
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

