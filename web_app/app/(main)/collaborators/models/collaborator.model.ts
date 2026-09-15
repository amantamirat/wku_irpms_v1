import { User } from "@/app/(main)/users/models/user.model";
import { Project } from "../../projects/models/project.model";

export enum CollaboratorStatus {
    pending = 'pending',
    verified = 'verified',
    declined = 'declined'
}

export type Collaborator = {
    _id?: string;
    project?: string | Project;
    member?: string | User;
    role?: string;
    isLeadPI?: boolean;
    status?: CollaboratorStatus;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface FilterCollaboratorsOptions {
    project?: string | Project;
    member?: string | User;
    status?: CollaboratorStatus;
}

export const roleOptions = [
    //{ label: 'Principal Investigator', value: 'Principal Investigator' },
    { label: 'Co-Investigator', value: 'Co-Investigator' },
    { label: 'Researcher', value: 'Researcher' },
    { label: 'Consultant', value: 'Consultant' },
    { label: 'Project Manager', value: 'Project Manager' }
];

