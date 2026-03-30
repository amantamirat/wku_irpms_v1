import { CollaboratorStatus } from "./collaborator.status";

// Base fields for creating a collaborator
export interface CreateCollaboratorDto {
    project: string;
    applicant: string;
    isLeadPI?: boolean;
    status?: CollaboratorStatus;
    applicantId?: string;
}

// Base fields for updating a collaborator
export interface UpdateCollaboratorDto {
    id: string;
    data: Partial<{
        isLeadPI: boolean;
        status: CollaboratorStatus;
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

