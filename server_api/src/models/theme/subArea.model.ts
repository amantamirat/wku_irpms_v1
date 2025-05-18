import mongoose, { Schema, model, Document } from 'mongoose';

export interface ISubArea extends Document {
    priority_area: mongoose.Types.ObjectId;
    title: string;
    createdAt?: Date;
    updatedAt?: Date;
}

const SubAreaSchema = new Schema<ISubArea>({
    priority_area: {
        type: Schema.Types.ObjectId,
        ref: 'PriorityArea',
        required: true
    },
    title: {
        type: String,
        required: true
    }
}, { timestamps: true });

export const SubArea = model<ISubArea>('SubArea', SubAreaSchema);
