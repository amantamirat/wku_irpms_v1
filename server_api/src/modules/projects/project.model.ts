import mongoose, { model, Schema } from "mongoose";
import { COLLECTIONS } from "../../util/collections.enum";
import { ProjectStatus } from "./project.enum";

export interface IProject extends Document {
    cycle: mongoose.Types.ObjectId;
    title: string;
    summary?: string;
    leadPI: mongoose.Types.ObjectId;
    status: ProjectStatus;
    createdBy: mongoose.Types.ObjectId;
    createdAt?: Date;
    updatedAt?: Date;
}

const ProjectSchema = new Schema<IProject>({
    cycle: {
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
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: COLLECTIONS.USER,
        immutable: true,
        required: true
    },

}, { timestamps: true });

export const Project = model<IProject>(COLLECTIONS.PROJECT, ProjectSchema);