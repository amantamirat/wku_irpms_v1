import { CollaboratorStatus, ICollaborator, LeaderRole } from "./collaborator.model";

export interface CollaboratorDto {
    _id?: string;
    member: string;
    role: string;
    //isLeadPI?: boolean;
    //status?: CollaboratorStatus;
}



// Base fields for creating a collaborator
export interface CreateCollaboratorDto extends Omit<CollaboratorDto, '_id' | 'isLeadPI' | 'status'> {
    project: string;
}

// Base fields for updating a collaborator
export interface UpdateCollaboratorDto extends Partial<CreateCollaboratorDto> {
}

// Options for querying collaborators
export interface FilterCollaborators {
    project?: string;
    member?: string;
    isLead?: boolean;
    status?: CollaboratorStatus,
    excludeStatus?: CollaboratorStatus[];
}



