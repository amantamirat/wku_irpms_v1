import mongoose, { Schema, model, Document } from 'mongoose';
import { Stage } from './stage.model';

export enum EvaluationStatus {
    Active = 'Active',
    Locked = 'Locked'
}

export interface IEvaluation extends Document {
    directorate: mongoose.Types.ObjectId;
    title: string;
    status: EvaluationStatus;
    createdAt?: Date;
    updatedAt?: Date;
}

const EvaluationSchema = new Schema<IEvaluation>({
    directorate: {
        type: Schema.Types.ObjectId,
        ref: 'Directorate',
        required: true
    },
    title: {
        type: String,
        unique: true,
        required: true
    },
    status: {
        type: String,
        enum: Object.values(EvaluationStatus),
        default: EvaluationStatus.Active,
        required: true
    }
}, { timestamps: true });

EvaluationSchema.pre('findOneAndDelete', async function (next) {
    const evaluation = await this.model.findOne(this.getQuery());
    if (!evaluation) return next();
    const isReferenced = await Stage.exists({ evaluation: evaluation._id });
    if (isReferenced) {
        return next(new Error('Cannot delete Evaluation: it has stages.'));
    }
    next();
});

export const Evaluation = model<IEvaluation>('Evaluation', EvaluationSchema);
