import mongoose, { Schema } from "mongoose";

export enum FieldType {
    TEXT = 'text',
    TEXTAREA = 'textarea',
    NUMBER = 'number',
    FILE = 'file',
}

export interface IField {
    _id?: mongoose.Types.ObjectId;
    label: string;
    fieldType: FieldType;
    isRequired: boolean;
    placeholder?: string;
    order: number;
}

export const FieldSchema = new Schema<IField>({
    label: {
        type: String,
        required: true,
        trim: true
    },
    fieldType: {
        type: String,
        enum: Object.values(FieldType),
        required: true
    },
    isRequired: {
        type: Boolean,
        default: false
    },
    placeholder: {
        type: String,
        default: ''
    },
    order: {
        type: Number,
        required: true
    }
}, { _id: true });