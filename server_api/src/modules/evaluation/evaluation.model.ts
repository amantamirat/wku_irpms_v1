import mongoose, { Schema, model, Document, Types } from 'mongoose';
export enum EvaluationType {
    evaluation = 'Evaluation',
    validation = 'Validation',
    stage = 'Stage',
    criterion = 'Criterion',
    option = 'Option'
}

export enum FormType {
    open = 'Open',
    closed = 'Closed'
}

export interface IEvaluation extends Document {
    type: EvaluationType;
    title: string;
    directorate?: mongoose.Types.ObjectId;
    parent?: Types.ObjectId;
    stage_level?: number;
    weight_value?: number;
    form_type?: FormType;
    createdAt?: Date;
    updatedAt?: Date;
}

const EvaluationSchema = new Schema<IEvaluation>({
    type: {
        type: String,
        enum: Object.values(EvaluationType),
        required: true,
        immutable: true
    },
    title: {
        type: String,
        required: true
    },
    directorate: {
        type: Schema.Types.ObjectId,
        ref: 'Organization'
    },
    parent: {
        type: Schema.Types.ObjectId,
        ref: 'Theme'
    },
    stage_level: {
        type: Number,
        min: 1,
        max: 10
    },
    weight_value: {
        type: Number,
        min: 0,
        max: 100
    },
    form_type: {
        type: String,
        enum: Object.values(FormType)
    }
}, { timestamps: true });

EvaluationSchema.index({ directorate: 1, title: 1 }, { unique: true });
EvaluationSchema.index({ parent: 1, title: 1 }, { unique: true });
EvaluationSchema.index({ parent: 1, stage_level: 1 },
    {
        unique: true,
        partialFilterExpression: {
            stage_level: { $exists: true },
            type: 'stage'
        }
    }
);
const Evaluation = model<IEvaluation>('Eval', EvaluationSchema);
export default Evaluation;