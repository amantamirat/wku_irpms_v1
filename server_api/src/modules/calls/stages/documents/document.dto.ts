// project-stage.dto.ts
import { DocumentStatus } from "./document.enum";

export interface GetProjectDocumentDTO {
    project?: string;
    stage?: string;
    status?: DocumentStatus;
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
        status: DocumentStatus;
        totalScore: number;
    }>;
}

