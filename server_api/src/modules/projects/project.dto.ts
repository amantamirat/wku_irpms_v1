import { CollaboratorDto } from "./collaborators/collaborator.dto";
import { PhaseDto } from "./phase/phase.dto";
import { ProjectStatus } from "./project.model";

export interface Options {
    populate?: {
        applicant?: boolean;
        grant?: boolean;
        currentStage?: boolean;
    };
}

export interface GetProjectsDTO {
    grant?: string;
    applicant?: string;
    call?: string;
    status?: ProjectStatus;
    options?: Options;
    //calendar?: string;
    //workspace?: string;

    //populate?: boolean;
    //directorate?: string;
    //skip?: number;
    //limit?: number;
}


export interface CreateGrantProjectDTO {
    grant: string;
    title: string;
    summary?: string;
    applicant: string;
    themes: string[];
    collaborators: CollaboratorDto[];
    phases: PhaseDto[];
}

// CREATE Project
export interface CreateProjectDTO {
    call?: string;
    grant: string;
    title: string;
    summary?: string;
    applicant: string;
    themes: string[];
    totalBudget?: number;
    totalDuration?: number;
    status?: ProjectStatus;
}

export interface ApplyProjectDTO {
    call: string;
    title: string;
    summary?: string;
    applicant: string;
    themes: string[];
    collaborators: CollaboratorDto[];
    phases: PhaseDto[];
    docPath: string;
}

// UPDATE Project
export interface UpdateProjectDTO {
    id: string;
    data: Partial<{
        title: string;
        summary: string;
        totalBudget: number;
        totalDuration: number;
        totalCollabs: number;
        themes: string[];
    }>;
    applicantId: string;
}

export interface ExistsProjectDTO {
    applicant?: string;
    grant?: string;
    call?: string;
}

