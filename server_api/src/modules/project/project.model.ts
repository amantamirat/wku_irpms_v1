import mongoose, { model, Schema } from "mongoose";
import { COLLECTIONS } from "../../enums/collections.enum";

interface IProject extends Document {
    call: mongoose.Types.ObjectId;
    title: string;
    summary?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

const ProjectSchema = new Schema<IProject>({
    call: {
        type: Schema.Types.ObjectId,
        ref: COLLECTIONS.CALL
    },
    title: {
        type: String,
        required: true
    },
    summary: {
        type: String,
    }
}, { timestamps: true });

export const Project = model<IProject>(COLLECTIONS.PROJECT, ProjectSchema);