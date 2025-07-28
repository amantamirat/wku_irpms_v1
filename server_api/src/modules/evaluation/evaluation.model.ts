import mongoose, { Schema, model, Document, Types } from 'mongoose';

export enum EvaluationType {
    evaluation = 'Evaluation',
    validation = 'Validation',
    stage = 'Stage',
    weight = 'Weight',
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
    max_value?: number;
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
        unique: true,
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
    max_value: {
        type: Number,
        min: 0
    },

}, { timestamps: true });



const Evaluation = model<IEvaluation>('Evaluation', EvaluationSchema);
 export default Evaluation;