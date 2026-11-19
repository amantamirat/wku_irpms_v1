import mongoose, { Document, model, Schema } from "mongoose";
import { COLLECTIONS } from "../../../common/constants/collections.enum";
import { IStatusHistory } from "../../../common/types/status-history";
import { createStatusHistorySchema } from "../../../common/schemas/status-history.schema";

export enum ProjectComponentStatus {
    pending = "pending",
    approved = "approved",
    completed = 'completed',
    refused = "refused",
}


export interface IProjectComponent extends Document {
    _id: mongoose.Types.ObjectId;

    project: mongoose.Types.ObjectId;
    title: string;
    description?: string;

    contributors: mongoose.Types.ObjectId[];
    activities: mongoose.Types.ObjectId[];
    themes: mongoose.Types.ObjectId[];

    status: ProjectComponentStatus;
    statusHistory: IStatusHistory<ProjectComponentStatus>[];

    createdBy?: mongoose.Types.ObjectId;
    updatedBy?: mongoose.Types.ObjectId;

    createdAt?: Date;
    updatedAt?: Date;
}

const ProjectComponentSchema = new Schema<IProjectComponent>(
    {
        project: {
            type: Schema.Types.ObjectId,
            ref: COLLECTIONS.PROJECT,
            required: true,
            immutable: true,
            index: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            trim: true,
        },
        contributors: [{
            type: Schema.Types.ObjectId,
            ref: COLLECTIONS.USER,
            required: true,
        }],
        activities: [{
            type: Schema.Types.ObjectId,
            ref: COLLECTIONS.ACTIVITY,
            required: true,
        }],
        themes: [{
            type: Schema.Types.ObjectId,
            ref: COLLECTIONS.THEME,
            required: true,
        }],

        // schema
        status: {
            type: String,
            enum: Object.values(ProjectComponentStatus),
            default: ProjectComponentStatus.pending,
            index: true,
        },
        statusHistory: {
            type: [createStatusHistorySchema(Object.values(ProjectComponentStatus))],
            default: [],
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: COLLECTIONS.USER,
        },
        updatedBy: {
            type: Schema.Types.ObjectId,
            ref: COLLECTIONS.USER,
        },
    },
    { timestamps: true }
);

ProjectComponentSchema.index({ project: 1, title: 1 });

export const ProjectComponent = model<IProjectComponent>(
    COLLECTIONS.PROJECT_COMPONENT,
    ProjectComponentSchema
);