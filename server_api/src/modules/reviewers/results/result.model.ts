//result.model.ts
import mongoose, { model, Schema } from "mongoose";
import { COLLECTIONS } from "../../../common/constants/collections.enum";

//mongo model
export interface IResult extends Document {
    reviewer: mongoose.Types.ObjectId;
    criterion: mongoose.Types.ObjectId;
    // computed or manual
    score?: number | null;
    // for SINGLE & MULTI
    selectedOptions?: mongoose.Types.ObjectId[];
    // for OPEN
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
    selectedOptions: [{
        type: Schema.Types.ObjectId,
    }],
    comment: {
        type: String,
        maxlength: 100 // optional but recommended
    },

}, { timestamps: true });

ResultSchema.index({ reviewer: 1, criterion: 1 }, { unique: true });
export const Result = model<IResult>(COLLECTIONS.RESULT, ResultSchema);