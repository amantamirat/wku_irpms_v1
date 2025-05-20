import mongoose, { Schema, model, Document } from 'mongoose';
import { CriterionOption } from './criterionOption.model';

export enum ResponseType {
    Open = 'Open',
    Closed = 'Closed'
}

//alteratively this model is known as Criterion 
export interface IWeight extends Document {
    stage: mongoose.Types.ObjectId;
    title: string;
    weight_value: number;
    response_type: ResponseType;
    createdAt?: Date;
    updatedAt?: Date;
}

const WeightSchema = new Schema<IWeight>({
    stage: {
        type: Schema.Types.ObjectId,
        ref: 'Stage',
        required: true
    },
    title: {
        type: String,
        unique: true,
        required: true
    },
    weight_value: {
        type: Number,
        min: 0,
        required: true
    },
    response_type: {
        type: String,
        enum: Object.values(ResponseType),
        default: ResponseType.Open,
        required: true
    },

}, { timestamps: true });

WeightSchema.pre('findOneAndDelete', async function (next) {
    const weight = await this.model.findOne(this.getQuery());
    if (!weight) return next();
    const isReferenced = await CriterionOption.exists({ weight: weight._id });
    if (isReferenced) {
        return next(new Error('Cannot delete Evaluation: it has options.'));
    }
    next();
});

export const Weight = model<IWeight>('Weight', WeightSchema);
