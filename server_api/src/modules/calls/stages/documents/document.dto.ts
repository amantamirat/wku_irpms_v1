// project-stage.dto.ts
import { ProjectDocStatus } from "./document.enum";

export interface GetDocumentDTO {
    project?: string;
    stage?: string;
    status?: ProjectDocStatus;
    skip?: number;
    limit?: number;
}

export interface CreateDocumentDTO {
    project: string;
    stage: string;
    documentPath: string;
}

export interface UpdateDocumentDTO {
    id: string;
    data: Partial<{
        status: ProjectDocStatus;
        totalScore: number;
    }>;
}

export interface UpdateStatusDTO {
    data: Partial<{
        documents: string[];
        status: ProjectDocStatus;
    }>;
}

