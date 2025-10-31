import mongoose, { model, Schema } from "mongoose";
import { COLLECTIONS } from "../../../util/collections.enum";
import { Criterion } from "../../evaluations/criteria/criterion.model";
import { Option } from "../../evaluations/options/option.model";

interface IResult extends Document {
    evaluator: mongoose.Types.ObjectId;
    criterion: mongoose.Types.ObjectId;
    score?: number;
    selected_option?: mongoose.Types.ObjectId;
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
        min: 0
    },
    selected_option: {
        type: Schema.Types.ObjectId,
        ref: Option.modelName
    },
    
}, { timestamps: true });
ResultSchema.index({ evaluator: 1, criterion: 1 }, { unique: true });
export const Result = model<IResult>(COLLECTIONS.RESULT, ResultSchema);