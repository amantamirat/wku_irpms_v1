import mongoose, { model, Schema } from "mongoose";
import { COLLECTIONS } from "../../common/constants/collections.enum";
import { ProjectStatus } from "./project.status";

export interface IProject extends Document {
    _id: mongoose.Types.ObjectId;
    call: mongoose.Types.ObjectId;
    title: string;
    summary?: string;
    leadPI: mongoose.Types.ObjectId;
    status: ProjectStatus;
    createdAt?: Date;
    updatedAt?: Date;
}

const ProjectSchema = new Schema<IProject>({    
    call: {
        type: Schema.Types.ObjectId,
        ref: COLLECTIONS.CALL,
        required: true,
        immutable: true
    },
    title: {
        type: String,
        required: true
    },
    summary: {
        type: String,
    },
    leadPI: {
        type: Schema.Types.ObjectId,
        ref: COLLECTIONS.APPLICANT,
        required: true
    },
    status: {
        type: String,
        enum: Object.values(ProjectStatus),
        default: ProjectStatus.pending,
        required: true
    }

}, { timestamps: true });

ProjectSchema.index(
    { currentDocument: 1 },
    { unique: true, partialFilterExpression: { currentDocument: { $exists: true } } }
);

export const Project = model<IProject>(COLLECTIONS.PROJECT, ProjectSchema);