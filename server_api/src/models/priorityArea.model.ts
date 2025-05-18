import mongoose, { Schema, model, Document } from 'mongoose';


export interface IPriorityArea extends Document {
    theme: mongoose.Types.ObjectId;
    title: string;
}

const PriorityAreaSchema = new Schema<IPriorityArea>({
    theme: {
        type: Schema.Types.ObjectId,
        ref: 'Theme',
        required: true
    },
    title: {
        type: String,
        required: true
    }
});

export const PriorityArea = model<IPriorityArea>('PriorityArea', PriorityAreaSchema);
