import mongoose, { Schema, model } from "mongoose";
import { COLLECTIONS } from "../../../common/constants/collections.enum";

export interface IGrantStage extends Document {
    _id: string;
    grant: mongoose.Types.ObjectId;
    name: string;
    order: number;
    evaluation: mongoose.Types.ObjectId;
    //change to array of evaluations to support parallel evaluations
    /**
     * Stage (Concept Note)
   ├── Technical Evaluation
   ├── Financial Evaluation
   └── Ethics Evaluation
     */
    minReviewers: number;
    maxReviewers: number;
    /**
     * evaluationStrategy: {
    type: String,
    enum: ['single', 'average', 'weighted', 'all_must_pass'],
    default: 'single'
}
     */
    createdAt?: Date;
    updatedAt?: Date;
}

const GrantStageSchema = new Schema<IGrantStage>({
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
        min: 1,
        max: 5
    },
    evaluation: {
        type: Schema.Types.ObjectId,
        ref: COLLECTIONS.EVALUATION,
        required: true,
        immutable: true,
    },
    minReviewers: {
        type: Number,
        required: true,
        min: 0,
        max: 10,
        default: 1
    },
    maxReviewers: {
        type: Number,
        required: true,
        min: 0,
        max: 10,
        default: 3
    },

}, { timestamps: true });


GrantStageSchema.index({ grant: 1, order: 1 }, { unique: true });
GrantStageSchema.index({ grant: 1, name: 1 }, { unique: true });

export const GrantStage = model<IGrantStage>(COLLECTIONS.GRANT_STAGE, GrantStageSchema);
