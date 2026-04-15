import mongoose, { Schema } from "mongoose";
import { COLLECTIONS } from "../../common/constants/collections.enum";
import { ISection, SectionSchema } from "./sections/section.model";


export enum TemplateStatus {
    draft = 'draft',
    published = 'published',
}

export interface ITemplate extends Document {
    name: string; // Proposal, Concept Note, etc.
    description?: string;
    sections: ISection[];
    status: TemplateStatus;
    createdAt?: Date;
    updatedAt?: Date;
}

const TemplateSchema = new Schema<ITemplate>({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        default: ''
    },
    sections: {
        type: [SectionSchema],
        default: []
    },
    status: {
        type: String,
        enum: Object.values(TemplateStatus),
        default: TemplateStatus.draft
    }
}, {
    timestamps: true
});

export const TemplateModel = mongoose.model<ITemplate>(
    COLLECTIONS.TEMPLATE,
    TemplateSchema
);