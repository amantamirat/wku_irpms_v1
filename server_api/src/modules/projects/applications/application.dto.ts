// project-stage.dto.ts
import { CreateProjectDTO } from "../project.dto";
import { ApplicationStatus } from "./application.model";

export interface GetApplicationDTO {
    project?: string;
    stage?: string;
    call?: string;
    status?: ApplicationStatus;
    populate?: boolean;
    skip?: number;
    limit?: number;
}

export interface CreateApplicationDTO {
    project: string;
    stage: string;
    documentPath: string;
    userId: string;
}

export interface UpdateApplicationDTO {
    id: string;
    data: Partial<{
        totalScore: number | null;
    }>;
    userId: string;
}

export interface UpdateApplicationStatusDTO {
    documents: string[];
    status: ApplicationStatus;
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
