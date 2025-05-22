import mongoose, { model, Schema } from "mongoose";

export interface ICriterionOption extends Document {
    weight: mongoose.Types.ObjectId;
    label: string;
    value: number;
    createdAt?: Date;
    updatedAt?: Date;
}

const CriterionOptionSchema = new Schema<ICriterionOption>({
    weight: {
        type: Schema.Types.ObjectId,
        ref: 'Weight',
        required: true
    },
    label: {
        type: String,
        required: true
    },
    value: {
        type: Number,
        min: 0,
        required: true
    },
}, { timestamps: true });

CriterionOptionSchema.index({ weight: 1, label: 1 }, { unique: true });
CriterionOptionSchema.index({ weight: 1, value: 1 }, { unique: true });
export const CriterionOption = model<ICriterionOption>('CriterionOption', CriterionOptionSchema);
