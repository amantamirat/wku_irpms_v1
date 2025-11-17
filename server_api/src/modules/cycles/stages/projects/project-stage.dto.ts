// project-stage.dto.ts
import { ProjectStageStatus } from "./project-stage.enum";

export interface GetProjectStagesDTO {
    projectId?: string;
    stageId?: string;
    status?: ProjectStageStatus;
    skip?: number;
    limit?: number;
}

export interface CreateProjectStageDTO {
    projectId: string;
    stageId: string;
    documentPath: string;
}

export interface UpdateProjectStageDTO {
    id: string;
    data: Partial<{
        //documentPath: string;
        status: ProjectStageStatus;
    }>;
}

export interface DeleteProjectStageDTO {
    id: string;
    userId: string;
}
