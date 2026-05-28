import mongoose, { model, Schema } from "mongoose";
import { COLLECTIONS } from "../../common/constants/collections.enum";

export enum ProjectStatus {
    draft = 'draft',
    submitted = "submitted",
    rejected = "rejected",
    accepted = "accepted",// PI can revise budget/collaborators
    granted = 'granted',
    refused = 'refused',
    active = 'active',
    terminated = 'terminated',
    completed = 'completed'
}

export interface IProject extends Document {
    _id: mongoose.Types.ObjectId;
    grant: mongoose.Types.ObjectId;
    call?: mongoose.Types.ObjectId;
    title: string;
    summary?: string;
    totalBudget?: number;
    totalDuration?: number;
    totalCollabs?: number;
    applicant: mongoose.Types.ObjectId;
    themes: mongoose.Types.ObjectId[];
    currentStage?: mongoose.Types.ObjectId;
    status: ProjectStatus;
    createdAt?: Date;
    updatedAt?: Date;
}

const ProjectSchema = new Schema<IProject>({
    grant: {
        type: Schema.Types.ObjectId,
        ref: COLLECTIONS.GRANT,
        required: true,
        immutable: true
    },

    call: {
        type: Schema.Types.ObjectId,
        ref: COLLECTIONS.CALL,
        immutable: true,
    },

    title: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },

    summary: {
        type: String,
    },

    totalBudget: {
        type: Number,
        min: 0
    },

    totalDuration: {
        type: Number,
        min: 0
    },

    totalCollabs: {
        type: Number,
        min: 0
    },

    applicant: {
        type: Schema.Types.ObjectId,
        ref: COLLECTIONS.USER,
        required: true
    },

    themes: [{
        type: Schema.Types.ObjectId,
        ref: COLLECTIONS.THEME,
        required: true
    }],

    currentStage: {
        type: Schema.Types.ObjectId,
        ref: COLLECTIONS.PROJECT_STAGE,
        unique: true,
        sparse: true // allows multiple docs with undefined currentStage
    },

    status: {
        type: String,
        enum: Object.values(ProjectStatus),
        default: ProjectStatus.draft,
        required: true
    }

}, { timestamps: true });

export const Project = model<IProject>(COLLECTIONS.PROJECT, ProjectSchema);