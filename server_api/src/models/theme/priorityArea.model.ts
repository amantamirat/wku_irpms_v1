import mongoose, { Schema, model, Document } from 'mongoose';
import { SubArea } from './subArea.model';


export interface IPriorityArea extends Document {
    theme: mongoose.Types.ObjectId;
    title: string;
    createdAt?: Date;
    updatedAt?: Date;
}

const PriorityAreaSchema = new Schema<IPriorityArea>({
    theme: {
        type: Schema.Types.ObjectId,
        ref: 'Theme2',
        required: true
    },
    title: {
        type: String,
        required: true
    }
}, { timestamps: true });

PriorityAreaSchema.pre('findOneAndDelete', async function (next) {
    const priority = await this.model.findOne(this.getQuery());
    if (!priority) return next();
    const isReferenced = await SubArea.exists({ priorityArea: priority._id });
    if (isReferenced) {
        return next(new Error('Cannot delete Priority Area: it has Sub Areas.'));
    }
    next();
});

export const PriorityArea = model<IPriorityArea>('PriorityArea', PriorityAreaSchema);
