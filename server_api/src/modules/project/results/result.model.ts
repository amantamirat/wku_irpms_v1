import mongoose, { model, Schema } from "mongoose";
import { COLLECTIONS } from "../../../enums/collections.enum";
import { Criterion } from "../../call/evaluations/evaluation.model";

interface IResult extends Document {
    evaluator: mongoose.Types.ObjectId;
    criterion: mongoose.Types.ObjectId;
    score: number;
    comment?: string;
    status?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

const ResultSchema = new Schema<IResult>({
    evaluator: {
        type: Schema.Types.ObjectId,
        ref: COLLECTIONS.REVIEWER,
        required: true,
        immutable: true
    },
    criterion: {
        type: Schema.Types.ObjectId,
        ref: Criterion.modelName,
        required: true,
        immutable: true
    },
    score: {
        type: Number,
        min: 0,
        required: true
    },
    comment: {
        type: String,
    },
    status: {
        type: String,
    }
}, { timestamps: true });

export const Result = model<IResult>(COLLECTIONS.RESULT, ResultSchema);