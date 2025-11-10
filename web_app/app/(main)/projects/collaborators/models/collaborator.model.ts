import { Applicant } from "@/app/(main)/applicants/models/applicant.model";
import { Project } from "../../models/project.model";

export enum CollaboratorStatus {
    pending = 'pending',
    active = 'active'
}

export type Collaborator = {
    _id?: string;
    project: string | Project;
    applicant?: string | Applicant;
    isLeadPI?: boolean;
    status?: CollaboratorStatus;
    createdAt?: Date;
    updatedAt?: Date;
}


export const sanitizeCollaborator = (collaborator: Partial<Collaborator>): Collaborator => {
    return {
        ...collaborator,
        project:
            typeof collaborator.project === "object" && collaborator.project !== null
                ? (collaborator.project as Project)._id
                : collaborator.project,
        applicant:
            typeof collaborator.applicant === "object" && collaborator.applicant !== null
                ? (collaborator.applicant as Applicant)._id
                : collaborator.applicant,
    } as Collaborator;
}
