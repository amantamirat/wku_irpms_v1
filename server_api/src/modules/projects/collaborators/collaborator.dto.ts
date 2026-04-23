import { CollaboratorStatus } from "./collaborator.status";

export interface CollaboratorDto {
    applicant: string;
    role: string;
    isLeadPI?: boolean;
}

// Base fields for creating a collaborator
export interface CreateCollaboratorDto extends CollaboratorDto {
    project: string;
    projectTitle?: string;
    status?: CollaboratorStatus;
    userId?: string;
}

// Base fields for updating a collaborator
export interface UpdateCollaboratorDto {
    id: string;
    data: Partial<{
        role: string;
        isLeadPI: boolean;
    }>;
    applicantId: string;
}

// Options for querying collaborators
export interface GetCollaboratorsOptions {
    project?: string;
    applicant?: string;
    populate?: boolean;
}

export interface ExistsCollabDTO {
    applicant?: string;
}

