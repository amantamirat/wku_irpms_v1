import { CollaboratorStatus, LeaderRole } from "./collaborator.model";

export interface CollaboratorDto {
    member: string; //memeber
    role: string;
    //isLeadPI?: boolean;
    //status?: CollaboratorStatus;
}

// Base fields for creating a collaborator
export interface CreateCollaboratorDto extends CollaboratorDto {
    project: string;
    //projectTitle?: string;
    //status?: CollaboratorStatus;
}

// Base fields for updating a collaborator
export interface UpdateCollaboratorDto extends Partial<CollaboratorDto> {
}

// Options for querying collaborators
export interface FilterCollaborators {
    project?: string;
    member?: string;
    isLead?: boolean;
    status?: CollaboratorStatus,
    excludeStatus?: CollaboratorStatus[];
}



