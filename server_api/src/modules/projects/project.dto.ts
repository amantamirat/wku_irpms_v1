import { PhaseDto } from "./phase/phase.dto";
import { ProjectStatus } from "./project.status";

export interface GetProjectsDTO {
    call?: string;
    leadPI?: string;
    status?: ProjectStatus;
    skip?: number;
    limit?: number;
}

// CREATE Project
export interface CreateProjectDTO {
    call: string;
    title: string;
    summary?: string;
    status?: ProjectStatus;
    applicantId: string;
}

// UPDATE Project
export interface UpdateProjectDTO {
    id: string;
    data: Partial<{
        title: string;
        summary: string;
        leadPI: string;
        status: ProjectStatus;
    }>;
    applicantId: string;
}

export interface UpdateStatusDTO {
    data: {
        id: string;
        status: ProjectStatus;
    };
}

export interface SubmitProjectDTO {
    call: string;
    title: string;
    summary?: string;
    leadPI: string;
    collaborators: string[];
    phases: PhaseDto[];
    themes: string[];
    documentPath: string;
}