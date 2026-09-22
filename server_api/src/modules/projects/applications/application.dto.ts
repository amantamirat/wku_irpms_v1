// project-stage.dto.ts
import { CreateProjectDTO } from "../project.dto";
import { AnonymizationStatus, ApplicationStatus } from "./application.model";



export interface CreateApplicationDTO {
    project: string;
    stage: string;
    documentPath: string;
}

export interface UpdateApplicationDTO {
    id: string;
    data: Partial<{
        totalScore: number | null;
        anonymizedDocumentPath: string;
        anonymizationStatus: AnonymizationStatus;
    }>;
    userId: string;
}

export interface UpdateApplicationStatusDTO {
    documents: string[];
    status: ApplicationStatus;
}

export interface FilterApplicationDTO {
    project?: string;
    projectIds?: string[];

    grantIds?: string[];
    organizationIds?: string[];
    workspaceIds?: string[];

    stage?: string;
    call?: string;
    status?: ApplicationStatus;
}

export interface ExistsApplicationDTO {
    stage?: string;
    project?: string;
}

export interface FindByIdOptions {
    populate?: {
        project?: boolean;
        stage?: boolean;
    };
}


export interface ApplyProjectDTO extends CreateProjectDTO {
    call: string;
    docPath: string;
}
