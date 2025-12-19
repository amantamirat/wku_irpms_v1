//project-stage.ts
import mongoose, { model, Schema } from "mongoose";
import { DocStatus } from "./document.enum";
import { COLLECTIONS } from "../../../../common/constants/collections.enum";

export interface IProjectDocument extends Document {
    stage: mongoose.Types.ObjectId;
    project: mongoose.Types.ObjectId;
    documentPath: string;
    totalScore?: number;
    status: DocStatus;
    createdAt?: Date;
    updatedAt?: Date;
}

const ProjecDocumentSchema = new Schema<IProjectDocument>({
    stage: {
        type: Schema.Types.ObjectId,
        ref: COLLECTIONS.STAGE,
        immutable: true,
        required: true
    },
    project: {
        type: Schema.Types.ObjectId,
        ref: COLLECTIONS.PROJECT,
        immutable: true,
        required: true
    },
    documentPath: {
        type: String,
        required: true
    },
    totalScore: {
        type: Number,
        min: 0
    },
    status: {
        type: String,
        enum: Object.values(DocStatus),
        default: DocStatus.pending,
        required: true
    },
}, { timestamps: true });

ProjecDocumentSchema.index({ project: 1, stage: 1 }, { unique: true });
export const ProjectDocument = model<IProjectDocument>(COLLECTIONS.PROJECT_DOCUMENT, ProjecDocumentSchema);