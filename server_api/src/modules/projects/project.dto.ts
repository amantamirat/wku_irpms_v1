import { CollaboratorDto } from "./collaborators/collaborator.dto";
import { PhaseDto } from "./phase/phase.dto";
import { ProjectStatus } from "./project.model";


export interface FilterProjectsDTO {
    grant?: string;
    calendar?: string;
    leadPI?: string;
    call?: string;
    title?: string;
    status?: ProjectStatus;
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
    docPath?: string;
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

        call: string | null;
        calendar: string | null;

        currentApplication: string | null;
        currentVerification: string | null;
    }>;

    userId: string;
}






