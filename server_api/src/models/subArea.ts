import mongoose, { Schema, model, Document } from 'mongoose';
import { IPriorityArea } from './priorityArea';

export interface ISubArea extends Document {
    priority_area: mongoose.Types.ObjectId;
    title: string;
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
});

const SubArea = model<ISubArea>('SubArea', SubAreaSchema);
export default SubArea;
