import mongoose, { Schema, model, Document } from 'mongoose';
import { Weight } from './weight.model';



export interface IStage extends Document {
    evaluation: mongoose.Types.ObjectId;
    title: string;
    level: number;
    total_weight: number;
    createdAt?: Date;
    updatedAt?: Date;
}

const StageSchema = new Schema<IStage>({
    evaluation: {
        type: Schema.Types.ObjectId,
        ref: 'Evaluation',
        required: true
    },

    title: {
        type: String,
        unique: true,
        required: true
    },

    level: {
        type: Number,
        min: 1,
        max: 30,
        required: true
    },

    total_weight: {
        type: Number,
        min: 0
    }
}, { timestamps: true });

StageSchema.pre('findOneAndDelete', async function (next) {
    const stage = await this.model.findOne(this.getQuery());
    if (!stage) return next();
    const isReferenced = await Weight.exists({ stage: stage._id });
    if (isReferenced) {
        return next(new Error('Cannot delete Stage: it has Weights.'));
    }
    next();
});

export const Stage = model<IStage>('Stage', StageSchema);
