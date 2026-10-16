import mongoose, { Document, model, Schema } from "mongoose";
import { COLLECTIONS } from "../../../../common/constants/collections.enum";

export interface IProjectComponent extends Document {
    _id: mongoose.Types.ObjectId;
    project: mongoose.Types.ObjectId;
    title: string;
    description?: string;
    contributors: mongoose.Types.ObjectId[];
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
