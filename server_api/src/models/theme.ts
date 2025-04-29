import mongoose, { Schema, model, Document } from 'mongoose';

export enum ThemeStatus {
    Active = 'Active',
    Locked = 'Locked'
}

export interface ITheme extends Document {
    directorate: mongoose.Types.ObjectId;
    title: string;
    status: ThemeStatus;
}

const ThemeSchema = new Schema<ITheme>({
    directorate: {
        type: Schema.Types.ObjectId,
        ref: 'Directorate',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: Object.values(ThemeStatus),
        required: true
    }
});

const Theme = model<ITheme>('Theme', ThemeSchema);
export default Theme;
