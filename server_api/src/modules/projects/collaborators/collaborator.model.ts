import mongoose, { model, Schema, Document } from "mongoose";
import { COLLECTIONS } from "../../../common/constants/collections.enum";
import { IUser } from "../../users/user.model";
import { IStatusHistory } from "../../../common/types/status-history";
import { createStatusHistorySchema } from "../../../common/schemas/status-history.schema";

export enum CollaboratorStatus {
    pending = 'pending',
    verified = 'verified',
    declined = 'declined'
}

export const LeaderRole = 'LEADER';

export interface ICollaborator extends Document {
    project: mongoose.Types.ObjectId;
    member: mongoose.Types.ObjectId | IUser;
    role: string;
    isLeadPI?: boolean;
    status: CollaboratorStatus;
    statusHistory: IStatusHistory<CollaboratorStatus>[];

    createdBy?: mongoose.Types.ObjectId;
    updatedBy?: mongoose.Types.ObjectId;
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
    member: {
        type: Schema.Types.ObjectId,
        ref: COLLECTIONS.USER,
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
    statusHistory: {
        type: [createStatusHistorySchema(
            Object.values(CollaboratorStatus)
        )],
        default: []
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: COLLECTIONS.USER
    },
    updatedBy: {
        type: Schema.Types.ObjectId,
        ref: COLLECTIONS.USER
    }
}, { timestamps: true });

CollaboratorSchema.index({ project: 1, member: 1 }, { unique: true });
export const Collaborator = model<ICollaborator>(COLLECTIONS.COLLABORATOR, CollaboratorSchema);

