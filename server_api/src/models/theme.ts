import mongoose, { Schema, model, Document } from 'mongoose';

export interface ITheme extends Document {
    directorate: mongoose.Types.ObjectId;
    title: string;
    status: 'Active' | 'Locked';
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
        enum: ['Active', 'Locked'],
        required: true
    }
});

const Theme = model<ITheme>('Theme', ThemeSchema);
export default Theme;
