import mongoose, { Schema, model, Document } from 'mongoose';
import { PriorityArea } from './priorityArea.model';

export enum ThemeStatus {
    Active = 'Active',
    Locked = 'Locked'
}

export interface ITheme extends Document {
    directorate: mongoose.Types.ObjectId;
    title: string;
    status: ThemeStatus;
    createdAt?: Date;
    updatedAt?: Date;
}

const ThemeSchema = new Schema<ITheme>({
    directorate: {
        type: Schema.Types.ObjectId,
        ref: 'Directorate',
        required: true
    },
    title: {
        type: String,
        unique:true,
        required: true
    },
    status: {
        type: String,
        enum: Object.values(ThemeStatus),
        default:ThemeStatus.Active,
        required: true
    }
}, { timestamps: true });

ThemeSchema.pre('findOneAndDelete', async function (next) {
    const theme = await this.model.findOne(this.getQuery());
    if (!theme) return next();
    const isReferenced = await PriorityArea.exists({ theme: theme._id });
    if (isReferenced) {
        return next(new Error('Cannot delete Theme: it has priority Areas.'));
    }
    next();
});

export const Theme = model<ITheme>('Theme2', ThemeSchema);
