//result.model.ts
import mongoose, { model, Schema } from "mongoose";
import { COLLECTIONS } from "../../../../../../util/collections.enum";

//mongo model
export interface IResult extends Document {
    reviewer: mongoose.Types.ObjectId;
    criterion: mongoose.Types.ObjectId;
    score?: number;
    selectedOption?: mongoose.Types.ObjectId;
    comment?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

const ResultSchema = new Schema<IResult>({
    reviewer: {
        type: Schema.Types.ObjectId,
        ref: COLLECTIONS.REVIEWER,
        required: true,
        immutable: true
    },
    criterion: {
        type: Schema.Types.ObjectId,
        ref: COLLECTIONS.CRITERION,
        required: true,
        immutable: true
    },
    score: {
        type: Number,
        min: 0
    },
    selectedOption: {
        type: Schema.Types.ObjectId,
        ref: COLLECTIONS.OPTION
    },
    comment: {
        type: String,
        maxlength: 2000 // optional but recommended
    },

}, { timestamps: true });
ResultSchema.index({ reviewer: 1, criterion: 1 }, { unique: true });
export const Result = model<IResult>(COLLECTIONS.RESULT, ResultSchema);