import mongoose, { model, Schema, Document } from "mongoose";
import { COLLECTIONS } from "../../../enums/collections.enum";


interface ICollaborator extends Document {
    project: mongoose.Types.ObjectId;
    applicant: mongoose.Types.ObjectId;
    isLeadPI?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

const CollaboratorSchema = new Schema<ICollaborator>({
    project: {
        type: Schema.Types.ObjectId,
        ref: COLLECTIONS.PROJECT,
        required: true
    },
    applicant: {
        type: Schema.Types.ObjectId,
        ref: COLLECTIONS.APPLICANT,
        required: true
    },
    isLeadPI: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

export const Collaborator = model<ICollaborator>(COLLECTIONS.COLLABORATOR, CollaboratorSchema);
