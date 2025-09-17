import { Applicant } from "@/app/(main)/applicants/models/applicant.model";
import { Project } from "../../models/project.model";

export enum CollaboratorStatus {
    pending = 'pending',
    active = 'active'
}

export type Collaborator = {
    _id?: string;
    project: string | Project;
    applicant: string | Applicant;
    isLeadPI?: boolean;
    status?: CollaboratorStatus;
    createdAt?: Date;
    updatedAt?: Date;
}