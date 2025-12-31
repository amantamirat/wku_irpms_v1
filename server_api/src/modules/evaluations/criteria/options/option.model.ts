import mongoose, { Schema, model } from "mongoose";
import { COLLECTIONS } from "../../../../common/constants/collections.enum";

// =========================
// 3️⃣ Option
// =========================

export interface IOption extends Document {
    criterion: mongoose.Types.ObjectId;
    title: string;
    score: number;
    createdAt?: Date;
    updatedAt?: Date;
}

const OptionSchema = new Schema<IOption>(
    {
        criterion: {
            type: Schema.Types.ObjectId,
            ref: COLLECTIONS.CRITERION,
            required: true,
            immutable: true,
        },
        title: { type: String, required: true },
        score: {
            type: Number,
            min: 0,
            max: 100,
            required: true,
        },
    },
    { timestamps: true }
);

OptionSchema.index({ criterion: 1, score: 1 }, { unique: true });

export const Option = model<IOption>(COLLECTIONS.OPTION, OptionSchema);