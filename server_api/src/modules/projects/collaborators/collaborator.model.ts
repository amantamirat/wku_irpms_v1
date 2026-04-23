import mongoose, { model, Schema, Document } from "mongoose";
import { COLLECTIONS } from "../../../common/constants/collections.enum";
import { CollaboratorStatus } from "./collaborator.status";

export enum CollaboratorRole {
    CO_I = "CO_I",
    ASSISTANT = "ASSISTANT",
    //INVESTIGATOR = "INVESTIGATOR",
    //ADVISOR = "ADVISOR",
    //COMMUNITY_PARTNER = "COMMUNITY_PARTNER",
}

export interface ICollaborator extends Document {
    project: mongoose.Types.ObjectId;
    applicant: mongoose.Types.ObjectId;//user
    role: string;
    isLeadPI?: boolean;
    status: CollaboratorStatus;
    createdAt?: Date;
    updatedAt?: Date;
}

const CollaboratorSchema = new Schema<ICollaborator>({
    project: {
        type: Schema.Types.ObjectId,
        ref: COLLECTIONS.PROJECT,
        immutable: true,
        required: true
    },
    applicant: {
        type: Schema.Types.ObjectId,
        ref: COLLECTIONS.APPLICANT,
        immutable: true,
        required: true
    },
    role: {
        type: String,
    },
    isLeadPI: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        enum: Object.values(CollaboratorStatus),
        default: CollaboratorStatus.pending,
        required: true
    },
}, { timestamps: true });

CollaboratorSchema.index({ project: 1, applicant: 1 }, { unique: true });
export const Collaborator = model<ICollaborator>(COLLECTIONS.COLLABORATOR, CollaboratorSchema);
