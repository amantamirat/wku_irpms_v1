// project-stage.dto.ts
import { DocStatus } from "./document.status";

export interface GetDocumentDTO {
    project?: string;
    stage?: string;
    status?: DocStatus;
    populate?: boolean;
    skip?: number;
    limit?: number;
}

export interface CreateDocumentDTO {
    project: string;
    stage: string;
    documentPath: string;
    applicantId: string;
}

export interface UpdateDocumentDTO {
    id: string;
    data: Partial<{
        status: DocStatus;
        totalScore: number;
    }>;
    applicantId: string;
}

export interface UpdateStatusDTO {
    documents: string[];
    status: DocStatus;
}

