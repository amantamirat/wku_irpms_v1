import { CollaboratorDto } from "./collaborators/collaborator.dto";
import { PhaseDto } from "./phase/phase.dto";
import { ProjectStatus } from "./project.model";


export interface FilterProjectsDTO {
    ids?: string[];

    grant?: string;
    grantIds?: string[];

    organization?: string;
    workspace?: string;

    calendar?: string;
    call?: string;

    leadPI?: string;

    title?: string;

    status?: ProjectStatus;
}


export interface CreateProjectDTO {
    grant: string;

    title: string;
    summary?: string;

    leadPI: string;

    themes: string[];

    collaborators: CollaboratorDto[];
    phases: PhaseDto[];

    calendar?: string;
    call?: string;

    docPath?: string;
}


export interface UpdateProjectDTO {
    id: string;

    data: Partial<{
        title: string;
        summary: string;

        themes: string[];

        call: string | null;
        calendar: string | null;

        currentApplication: string | null;
        currentPhase: string | null;
        currentVerification: string | null;
    }>;
}