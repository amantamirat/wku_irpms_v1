import mongoose, { Schema, Document } from "mongoose";
import { COLLECTIONS } from "../../common/constants/collections.enum";


export interface ITemplateSection {
    name: string;
    aliases: string[];
    required: boolean;
    minWords?: number;
    maxWords?: number;
    order?: number;
    guidelines?: string;
}

export interface ITemplate extends Document {
    name: string;
    description?: string;
    minPages?: number;
    maxPages?: number;
    sections: ITemplateSection[];
    createdAt?: Date;
    updatedAt?: Date;
}

const TemplateSectionSchema = new Schema<ITemplateSection>(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        aliases: {
            type: [String],
            default: [],
        },
        required: {
            type: Boolean,
            default: true,
        },
        minWords: {
            type: Number,
            min: 0,
        },
        maxWords: {
            type: Number,
            min: 0,
        },
        order: {
            type: Number,
            min: 1,
        },
        guidelines: {
            type: String,
            trim: true,
        }
    },
    {
        _id: false,
    }
);

const TemplateSchema = new Schema<ITemplate>(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            unique: true,
        },
        description: {
            type: String,
            trim: true,
        },
        minPages: {
            type: Number,
            min: 1,
        },
        maxPages: {
            type: Number,
            min: 1,
        },
        sections: {
            type: [TemplateSectionSchema],
            default: [],
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

export const Template = mongoose.model<ITemplate>(
    COLLECTIONS.TEMPLATE,
    TemplateSchema
);