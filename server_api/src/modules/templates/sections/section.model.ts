import mongoose, { Schema } from "mongoose";
import { FieldSchema, IField } from "../fields/field.model";

export interface ISection {
    _id?: mongoose.Types.ObjectId;
    title: string;           // e.g. "Introduction"
    description?: string;   // guidance text
    order: number;
    isRequired: boolean;
    fields: IField[];
}

export const SectionSchema = new Schema<ISection>({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        default: ''
    },
    order: {
        type: Number,
        required: true
    },
    isRequired: {
        type: Boolean,
        default: true
    },
    fields: {
        type: [FieldSchema],
        default: []
    }
}, { _id: true });