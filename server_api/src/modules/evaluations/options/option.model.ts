import mongoose, { Schema, model } from "mongoose";
import { COLLECTIONS } from "../../../util/collections.enum";
import { Criterion } from "../criteria/criterion.model";

// =========================
// 3️⃣ Option
// =========================


export interface IOption extends Document {
    criterion: mongoose.Types.ObjectId;
    title: string;
    value: number;
    createdAt?: Date;
    updatedAt?: Date;
}

const OptionSchema = new Schema<IOption>(
    {
        criterion: {
            type: Schema.Types.ObjectId,
            ref: Criterion.modelName,
            required: true,
            immutable: true,
        },
        title: { type: String, required: true },
        value: {
            type: Number,
            min: 0,
            max: 100,
            required: true,
        },
    },
    { timestamps: true }
);

OptionSchema.index({ criterion: 1, weight_value: 1 }, { unique: true });

export const Option = model<IOption>(COLLECTIONS.OPTION, OptionSchema);