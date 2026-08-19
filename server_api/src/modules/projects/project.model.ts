import mongoose, { model, Schema } from "mongoose";
import { COLLECTIONS } from "../../common/constants/collections.enum";

export enum ProjectStatus {
    draft = 'draft',
    submitted = "submitted",
    rejected = "rejected",
    accepted = "accepted",
    approved = "approved",// PI can revise budget/collaborators
    refused = 'refused',
    granted = 'granted',
    active = 'active',
    terminated = 'terminated',
    completed = 'completed'
}

export interface IProject extends Document {
    _id: mongoose.Types.ObjectId;
    grant: mongoose.Types.ObjectId;
    calendar?: mongoose.Types.ObjectId;
    call?: mongoose.Types.ObjectId;
    title: string;
    summary?: string;
    totalBudget?: number;
    totalDuration?: number;
    totalCollabs?: number;
    leadPI: mongoose.Types.ObjectId;
    themes: mongoose.Types.ObjectId[];
    currentApplication?: mongoose.Types.ObjectId;
    currentVerification?: mongoose.Types.ObjectId;
    status: ProjectStatus;
    createdBy?: mongoose.Types.ObjectId; // User who created the record
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
    calendar: {
        type: Schema.Types.ObjectId,
        ref: COLLECTIONS.CALENDAR,
        required: true,
        //immutable: true,
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

    leadPI: {
        type: Schema.Types.ObjectId,
        ref: COLLECTIONS.USER,
        required: true
    },

    themes: [{
        type: Schema.Types.ObjectId,
        ref: COLLECTIONS.THEME,
        required: true
    }],

    currentApplication: {
        type: Schema.Types.ObjectId,
        ref: COLLECTIONS.APPLICATION,
        unique: true,
        sparse: true // allows multiple docs with undefined
    },

    currentVerification: {
        type: Schema.Types.ObjectId,
        ref: COLLECTIONS.VERIFICATION,
        unique: true,
        sparse: true // allows multiple docs with undefined
    },

    status: {
        type: String,
        enum: Object.values(ProjectStatus),
        default: ProjectStatus.draft,
        required: true
    },

    createdBy: {
        type: Schema.Types.ObjectId,
        ref: COLLECTIONS.USER,
    },

}, { timestamps: true });

export const Project = model<IProject>(COLLECTIONS.PROJECT, ProjectSchema);