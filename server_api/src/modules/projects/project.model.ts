import mongoose, { model, Schema } from "mongoose";
import { COLLECTIONS } from "../../common/constants/collections.enum";
import { IStatusHistory } from "../../common/types/status-history";
import { createStatusHistorySchema } from "../../common/schemas/status-history.schema";

export enum ProjectStatus {
    draft = 'draft',
    approved = "approved",
    refused = 'refused',
    granted = 'granted',
    completed = 'completed'
}

export interface IProject extends Document {
    _id: mongoose.Types.ObjectId;
    grant: mongoose.Types.ObjectId;

    organization?: mongoose.Types.ObjectId;
    workspace?: mongoose.Types.ObjectId;
    calendar?: mongoose.Types.ObjectId | null;
    call?: mongoose.Types.ObjectId | null;

    title: string;
    summary?: string;
    totalBudget?: number;
    totalDuration?: number;
    totalCollabs?: number;
    leadPI: mongoose.Types.ObjectId;
    themes: mongoose.Types.ObjectId[];
    currentApplication?: mongoose.Types.ObjectId | null;
    currentPhase?: mongoose.Types.ObjectId | null;

    currentVerification?: mongoose.Types.ObjectId | null;

    status: ProjectStatus;
    statusHistory: IStatusHistory<ProjectStatus>[];

    createdBy?: mongoose.Types.ObjectId; // User who created the record
    updatedBy?: mongoose.Types.ObjectId; // User who last updated the record

    createdAt?: Date;
    updatedAt?: Date;
}

const ProjectStatusHistorySchema =
    createStatusHistorySchema(
        Object.values(ProjectStatus)
    );

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
    organization: {
        type: Schema.Types.ObjectId,
        ref: COLLECTIONS.ORGANIZATION,
        //immutable: true,
    },
    workspace: {
        type: Schema.Types.ObjectId,
        ref: COLLECTIONS.ORGANIZATION,
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

    currentPhase: {
        type: Schema.Types.ObjectId,
        ref: COLLECTIONS.PHASE,
        unique: true,
        sparse: true
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

    statusHistory: {
        type: [ProjectStatusHistorySchema],
        default: []
    },

    createdBy: {
        type: Schema.Types.ObjectId,
        ref: COLLECTIONS.USER,
    },
    updatedBy: {
        type: Schema.Types.ObjectId,
        ref: COLLECTIONS.USER,
    },

}, { timestamps: true });

export const Project = model<IProject>(COLLECTIONS.PROJECT, ProjectSchema);