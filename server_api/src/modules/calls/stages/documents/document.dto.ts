// project-stage.dto.ts
import { ProjectDocStatus } from "./document.enum";

export interface GetProjectDocumentDTO {
    project?: string;
    stage?: string;
    status?: ProjectDocStatus;
    skip?: number;
    limit?: number;
}

export interface CreateProjectDocumentDTO {
    project: string;
    stage: string;
    documentPath: string;
}

export interface UpdateProjectDocumentDTO {
    id: string;
    data: Partial<{
        status: ProjectDocStatus;
        totalScore: number;
    }>;
}

