import { CollaboratorStatus } from "./collaborator.model";

export interface CollaboratorDto {
    member: string; //memeber
    role: string;
    isLeadPI?: boolean;
    status?: CollaboratorStatus;
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
        member:string;
        role: string;
        isLeadPI: boolean;
    }>;
}

// Options for querying collaborators
export interface FilterCollaborators {
    project?: string;
    member?: string;
    isLead?: boolean;
    status?: CollaboratorStatus,
    excludeStatus?: CollaboratorStatus[];
}



