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
        unique: true,
        required: true
    },
    value: {
        type: Number,
        min: 0,
        required: true
    },
}, { timestamps: true });


export const CriterionOption = model<ICriterionOption>('CriterionOption', CriterionOptionSchema);
