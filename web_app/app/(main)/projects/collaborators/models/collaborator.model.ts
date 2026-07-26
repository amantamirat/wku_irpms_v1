import { User } from "@/app/(main)/users/models/user.model";
import { Project } from "../../models/project.model";

export enum CollaboratorStatus {
    pending = 'pending',
    verified = 'verified'
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

export interface GetCollaboratorsOptions {
    project?: string | Project;
    member?: string | User;
    status?: CollaboratorStatus;
    populate?: boolean;
}

export const sanitizeCollaborator = (collaborator: Partial<Collaborator>): Collaborator => {
    return {
        ...collaborator,
        project:
            typeof collaborator.project === "object" && collaborator.project !== null
                ? (collaborator.project as Project)._id
                : collaborator.project,
        member:
            typeof collaborator.member === "object" && collaborator.member !== null
                ? (collaborator.member as User)._id
                : collaborator.member,
    } as Collaborator;
}


export const roleOptions = [
    //{ label: 'Principal Investigator', value: 'Principal Investigator' },
    { label: 'Co-Investigator', value: 'Co-Investigator' },
    { label: 'Researcher', value: 'Researcher' },
    { label: 'Consultant', value: 'Consultant' },
    { label: 'Project Manager', value: 'Project Manager' }
];

