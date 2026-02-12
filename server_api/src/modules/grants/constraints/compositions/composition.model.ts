import mongoose, { model, Schema } from "mongoose";
import { COLLECTIONS } from "../../../../common/constants/collections.enum";
import { ApplicantConstraint } from "../applicant/applicant-constraint.model";

export interface IRange {
    min: number;
    max: number;
}

const RangeSchema = new Schema(
    {
        min: { type: Number, required: true },
        max: { type: Number, required: true },
    },
    { _id: false } // important: prevents extra _id for subdocument
);

export interface IComposition extends Document {
    constraint: mongoose.Types.ObjectId;
    max: number; // maximum allowed
    min: number; // minimum required
    item?: string; // allowed values for enum-based constraints
    range?: IRange;  // allowed values for range-based constraints
}

const CompositionSchema = new Schema<IComposition>({
    constraint: {
        type: Schema.Types.ObjectId,
        ref: ApplicantConstraint.modelName,
        required: true,
        immutable: true
    },
    max: {
        type: Number,
        min: 0,
        default: Number.MAX_SAFE_INTEGER,
        required: true
    },
    min: {
        type: Number,
        min: 0,
        required: true
    },
    item: {
        type: String,
    },
    range: {
        type: RangeSchema
    },

});

// Unique compound index on parent and item, but allow multiple docs with item=null
CompositionSchema.index(
    { constraint: 1, item: 1 },
    {
        unique: true,
        partialFilterExpression: { item: { $type: "string" } }
    }
);

export const Composition = model<IComposition>(COLLECTIONS.COMPOSITION, CompositionSchema);

