import mongoose, { Schema, model } from "mongoose";
import { COLLECTIONS } from "../../../common/constants/collections.enum";



export interface IStage extends Document {
    _id: string;
    grant: mongoose.Types.ObjectId;
    name: string;
    order: number;
    evaluation: mongoose.Types.ObjectId;
    createdAt?: Date;
    updatedAt?: Date;
}

const StageSchema = new Schema<IStage>({
    grant: {
        type: Schema.Types.ObjectId,
        ref: COLLECTIONS.GRANT,
        required: true,
        immutable: true,
    },
    name: {
        type: String,
        required: true
    },
    order: {
        type: Number,
        required: true,
        //immutable: true,
    },
    evaluation: {
        type: Schema.Types.ObjectId,
        ref: COLLECTIONS.EVALUATION,
        required: true,
        immutable: true,
    },

}, { timestamps: true });


StageSchema.index({ grant: 1, order: 1 }, { unique: true });

export const Stage = model<IStage>(COLLECTIONS.GRANT_STAGE, StageSchema);
