import { CollaboratorDto } from "./collaborators/collaborator.dto";
import { PhaseDto } from "./phase/phase.dto";
import { ProjectStatus } from "./project.model";

/*
export interface Options {
    populate?: {
        leadPI?: boolean;
        grant?: boolean;
        calendar?: boolean;
        currentApplication?: boolean;
    };
}*/

export interface FilterProjectsDTO {
    grant?: string;
    calendar?: string;
    leadPI?: string;
    call?: string;
    status?: ProjectStatus;
    // populate?: boolean;
    //options?: Options;
    //calendar?: string;
    //workspace?: string;

    //populate?: boolean;
    //directorate?: string;
    //skip?: number;
    //limit?: number;
}


export interface CreateProjectDTO {
    calendar?: string;
    call?: string;
    grant: string;
    title: string;
    summary?: string;
    leadPI: string;
    themes: string[];
    collaborators: CollaboratorDto[];
    phases: PhaseDto[];
    status?: ProjectStatus;
    createdBy?: string;
    userId?: string;
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
    userId: string;
}


