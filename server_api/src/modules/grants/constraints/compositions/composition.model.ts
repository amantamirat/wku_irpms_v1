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

    // For enum constraints
    enumValue?: string;

    // For dynamic constraints
    item?: mongoose.Types.ObjectId;
    itemModel?: COLLECTIONS.ORGANIZATION | COLLECTIONS.SPECIALIZATION;

    // For range constraints
    range?: IRange;
}

const CompositionSchema = new Schema<IComposition>(
    {
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

        // ✅ For enum constraints
        enumValue: {
            type: String
        },

        // ✅ For dynamic constraints (polymorphic reference)
        item: {
            type: Schema.Types.ObjectId,
            refPath: "itemModel"
        },

        itemModel: {
            type: String,
            enum: [COLLECTIONS.ORGANIZATION, COLLECTIONS.SPECIALIZATION]
        },

        // ✅ For range constraints
        range: {
            type: RangeSchema
        }
    },
    {
        timestamps: true
    }
);


// Unique compound index on parent and item, but allow multiple docs with item=null
CompositionSchema.index(
  { constraint: 1, item: 1 },
  {
    unique: true,
    partialFilterExpression: {
      item: { $exists: true, $ne: null }
    }
  }
);


CompositionSchema.index(
    { constraint: 1, enumValue: 1 },
    { unique: true, sparse: true }
);

export const Composition = model<IComposition>(COLLECTIONS.COMPOSITION, CompositionSchema);

