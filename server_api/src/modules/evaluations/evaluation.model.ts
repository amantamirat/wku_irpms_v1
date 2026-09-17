import { model, Schema } from "mongoose";
import { COLLECTIONS } from "../../common/constants/collections.enum";
import { ResourceStatus } from "./evaluation.state-machine";

export interface IEvaluation extends Document {
    _id?:string;
    title: string;
    description?: string;
    weight: number;
    status: ResourceStatus;
    createdAt?: Date;
    updatedAt?: Date;
}

const EvaluationSchema = new Schema<IEvaluation>(
    {
        title: {
            type: String,
            unique: true,
            required: true
        },
        description: { type: String },
        weight: {
            type: Number,
            min: 5,
            required: true,
        },
        status: {
            type: String,
            enum: Object.values(ResourceStatus),
            default: ResourceStatus.draft,
            required: true
        },
    },
    { timestamps: true }
);

export const Evaluation = model<IEvaluation>(
    COLLECTIONS.EVALUATION,
    EvaluationSchema
);




