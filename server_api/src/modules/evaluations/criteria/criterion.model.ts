import mongoose, { model, Schema, Document } from "mongoose";
import { COLLECTIONS } from "../../../common/constants/collections.enum";

// 1️⃣ Enums & Sub-Interfaces
export enum FormType {
    OPEN = 'Open',             // Textarea (No score)
    SINGLE_CHOICE = 'Single',  // Radio buttons (One score)
    MULTIPLE_CHOICE = 'Multi', // Checkboxes (Cumulative score)
    NUMBER = 'Number'          // Numeric input (Raw score)
}

export interface IOption {
    _id?: mongoose.Types.ObjectId; 
    title: string;
    score: number;
}

// 2️⃣ Criterion Interface
export interface ICriterion extends Document {
    evaluation: mongoose.Types.ObjectId;
    title: string;
    weight: number;
    formType: FormType;
    options: IOption[]; 
    order: number;
    isRequired: boolean; // Added for form validation logic
    createdAt?: Date;
    updatedAt?: Date;
}

// 3️⃣ Schema Definition
const OptionSchema = new Schema<IOption>({
    // We explicitly define _id so we can reference it in Results
    _id: { type: Schema.Types.ObjectId, auto: true },
    title: { type: String, required: true },
    score: { type: Number, default: 0 }
});

const CriterionSchema = new Schema<ICriterion>(
    {
        evaluation: {
            type: Schema.Types.ObjectId,
            ref: COLLECTIONS.EVALUATION, // Use string constant for consistency
            required: true,
            immutable: true,
        },
        title: { type: String, required: true, trim: true },
        weight: {
            type: Number,
            min: 0,
            max: 100,
            required: true,
        },
        formType: {
            type: String,
            enum: Object.values(FormType),
            required: true,
            default: FormType.SINGLE_CHOICE
        },
        // ✅ The Embedded Options Array
        options: [OptionSchema], 
        
        // ✅ Order for UI sorting
        order: { type: Number, default: 0 },

        isRequired: { type: Boolean, default: true }
    },
    { timestamps: true }
);

// 4️⃣ Indexes
// Ensures questions are usually queried by evaluation and sorted by order
CriterionSchema.index({ evaluation: 1, order: 1 });

export const Criterion = model<ICriterion>(
    COLLECTIONS.CRITERION,
    CriterionSchema
);