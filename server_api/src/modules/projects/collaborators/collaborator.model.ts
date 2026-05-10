import mongoose, { model, Schema, Document } from "mongoose";
import { COLLECTIONS } from "../../../common/constants/collections.enum";

export enum CollaboratorRole {
    CO_I = "CO_I",
    ASSISTANT = "ASSISTANT",
    //INVESTIGATOR = "INVESTIGATOR",
    //ADVISOR = "ADVISOR",
    //COMMUNITY_PARTNER = "COMMUNITY_PARTNER",
}

export enum CollaboratorStatus {
    pending = 'pending',
    verified = 'verified'
}

export interface ICollaborator extends Document {
    project: mongoose.Types.ObjectId;
    applicant: mongoose.Types.ObjectId;//member
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
        ref: COLLECTIONS.USER,
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

