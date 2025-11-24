import mongoose from "mongoose";
import { CollaboratorStatus } from "./collaborator.enum";

// Base fields for creating a collaborator
export interface CreateCollaboratorDto {
    project: string;
    applicant: string;
    isLeadPI?: boolean;
    status?: CollaboratorStatus;
    userId: string; // actor performing the operation
}

// Base fields for updating a collaborator
export interface UpdateCollaboratorDto {
    id: string;
    data: Partial<{
        isLeadPI: boolean;
        status: CollaboratorStatus;
    }>;
    userId: string;
}

// Options for querying collaborators
export interface GetCollaboratorsOptions {
    //userId?: string;
    project?: string;
    applicant?: string;
    //status?:string;
}

