import mongoose, { Schema, model, Document } from 'mongoose';

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

export const Theme = model<ITheme>('Theme', ThemeSchema);
