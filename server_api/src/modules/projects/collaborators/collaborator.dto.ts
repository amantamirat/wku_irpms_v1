import mongoose from "mongoose";
import { CollaboratorStatus } from "./collaborator.enum";

// Base fields for creating a collaborator
export interface CreateCollaboratorDto {
    project: mongoose.Types.ObjectId;
    applicant: mongoose.Types.ObjectId;
    isLeadPI?: boolean;
    status?: CollaboratorStatus;
    userId: string; // actor performing the operation
}

// Base fields for updating a collaborator
export interface UpdateCollaboratorDto {
    id: string | mongoose.Types.ObjectId;
    data: Partial<{
        isLeadPI: boolean;
        status: CollaboratorStatus;
    }>;
    userId: string;
}

// Options for querying collaborators
export interface GetCollaboratorsOptions {
    userId?: string;
    project?: mongoose.Types.ObjectId;
    applicant?: mongoose.Types.ObjectId;
    status?: CollaboratorStatus;
}

// Delete DTO
export interface DeleteCollaboratorDto {
    id: string | mongoose.Types.ObjectId;
    userId: string;
}
