import mongoose, { model, Schema } from "mongoose";
import { COLLECTIONS } from "../../enums/collections.enum";

interface IProject extends Document {
    call: mongoose.Types.ObjectId;
    title: string;
    summary?: string;
    createdBy: mongoose.Types.ObjectId;
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
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: COLLECTIONS.USER,
        required: true
    },
}, { timestamps: true });

export const Project = model<IProject>(COLLECTIONS.PROJECT, ProjectSchema);