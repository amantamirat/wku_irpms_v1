import { PhaseDto } from "./phase/phase.dto";
import { ProjectStatus } from "./project.enum";


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
    leadPI: string;
}

// UPDATE Project
export interface UpdateProjectDTO {
    id: string;
    data: Partial<{
        title: string;
        summary: string;
        status: ProjectStatus;
        leadPI: string;
    }>;
    userId: string;  // who is making the update
}

export interface SubmitProjectDTO {
    call: string;
    title: string;
    summary?: string;
    leadPI: string;
    collaborators?: string[];
    phases?: PhaseDto[];
    themes?: string[];
    documentPath?: string;
}