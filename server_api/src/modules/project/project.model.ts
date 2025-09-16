import mongoose, { model, Schema } from "mongoose";
import { COLLECTIONS } from "../../enums/collections.enum";
import { ProjectStatus } from "./enums/project.status.enum";

interface IProject extends Document {
    call: mongoose.Types.ObjectId;
    title: string;
    summary?: string;
    createdBy: mongoose.Types.ObjectId;
    status: ProjectStatus;
    createdAt?: Date;
    updatedAt?: Date;
}

const ProjectSchema = new Schema<IProject>({
    call: {
        type: Schema.Types.ObjectId,
        ref: COLLECTIONS.CALL,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    summary: {
        type: String,
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