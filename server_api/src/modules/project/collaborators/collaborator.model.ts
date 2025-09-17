import mongoose, { model, Schema, Document } from "mongoose";
import { COLLECTIONS } from "../../../enums/collections.enum";
import { CollaboratorStatus } from "../enums/collaborator.status.enum";


interface ICollaborator extends Document {
    project: mongoose.Types.ObjectId;
    applicant: mongoose.Types.ObjectId;
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
