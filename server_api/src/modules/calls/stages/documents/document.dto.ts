// project-stage.dto.ts
import { DocStatus } from "./document.enum";

export interface GetDocumentDTO {
    project?: string;
    stage?: string;
    status?: DocStatus;
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
        status: DocStatus;
        totalScore: number;
    }>;
}

export interface UpdateStatusDTO {
    data: Partial<{
        documents: string[];
        status: DocStatus;
    }>;
}

