import mongoose, { model, Schema } from "mongoose";
import { COLLECTIONS } from "../../../enums/collections.enum";
import { ApplicantConstraint } from "./constraint.model";


export interface IComposition extends Document {    
    parent: mongoose.Types.ObjectId;
    value: number; // Required number or ratio of applicants
    max?: number; // value for range-based constraints
    min?: number; // value for range-based constraints
    item?: string; // Allowed values for enum-based constraints
}


const CompositionSchema = new Schema<IComposition>({
    parent: {
        type: Schema.Types.ObjectId,
        ref: ApplicantConstraint.modelName,
        required: true,
        immutable: true
    },
    value: {
        type: Number,
        required: true
    },
    max: {
        type: Number,
        min: 0,
        default: Number.MAX_SAFE_INTEGER, //Infinity
    },
    min: {
        type: Number,
        min: 0,
        default: 0
    },
    item: {
        type: String,
    }
});

export const Composition = model<IComposition>(COLLECTIONS.COMPOSITION, CompositionSchema);

