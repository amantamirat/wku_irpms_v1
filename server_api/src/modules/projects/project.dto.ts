import { CollaboratorDto } from "./collaborators/collaborator.dto";
import { PhaseDto } from "./phase/phase.dto";
import { ProjectStatus } from "./project.model";

export interface FindByIdOptions {
    populate?: {
        applicant?: boolean;
        grantAllocation?: boolean;
    };
}

export interface GetProjectsDTO {
    grantAllocation?: string;
    applicant?: string;
    calendar?: string;
    grant?: string;
    workspace?: string;
    status?: ProjectStatus;
    populate?: boolean;
    //directorate?: string;
    //skip?: number;
    //limit?: number;
}

// CREATE Project
export interface CreateProjectDTO {
    call?: string;
    grantAllocation: string;
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
    grantAllocation?: string;
}

