// document-template.model.ts

import mongoose, { Document, Schema } from "mongoose";
import { COLLECTIONS } from "../../common/constants/collections.enum";

export enum DocumentTemplateType {
    AGREEMENT = "agreement",
    CERTIFICATE = "certificate",
}

export enum TemplateEngine {
    HANDLEBARS = "handlebars",
}

export enum DocumentTemplateStatus {
    DRAFT = "draft",
    ACTIVE = "active",
    ARCHIVED = "archived",
}

export type TemplateVariableType =
    | "text"
    | "currency"
    | "date"
    | "object"
    | "collection";

export interface ITemplateVariable {
    key: string;
    label: string;
    type: TemplateVariableType;
}

export interface IDocumentTemplate extends Document {
    name: string;
    description?: string;
    version: number;
    type: DocumentTemplateType;
    engine: TemplateEngine;
    filePath: string;
    status: DocumentTemplateStatus;
    variables: Record<string, ITemplateVariable>;
    createdBy: mongoose.Types.ObjectId;
    updatedBy?: mongoose.Types.ObjectId;
    createdAt?: Date;
    updatedAt?: Date;
}

const TemplateVariableSchema = new Schema<ITemplateVariable>(
    {
        key: {
            type: String,
            required: true,
            trim: true,
        },
        label: {
            type: String,
            required: true,
            trim: true,
        },
        type: {
            type: String,
            enum: ["text", "currency", "date", "collection", "object"],
            required: true,
        },
    },
    {
        _id: false,
    }
);

const DocumentTemplateSchema = new Schema<IDocumentTemplate>(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },

        description: {
            type: String,
            trim: true,
        },

        version: {
            type: Number,
            required: true,
            min: 1,
            default: 1,
        },

        type: {
            type: String,
            enum: Object.values(DocumentTemplateType),
            required: true,
        },

        engine: {
            type: String,
            enum: Object.values(TemplateEngine),
            default: TemplateEngine.HANDLEBARS,
            required: true,
        },

        filePath: {
            type: String,
            required: true,
            trim: true,
        },

        status: {
            type: String,
            enum: Object.values(DocumentTemplateStatus),
            default: DocumentTemplateStatus.DRAFT,
            required: true,
        },

        variables: {
            type: Map,
            of: TemplateVariableSchema,
            default: {},
            required: true,
        },

        createdBy: {
            type: Schema.Types.ObjectId,
            ref: COLLECTIONS.USER,
            required: true,
        },

        updatedBy: {
            type: Schema.Types.ObjectId,
            ref: COLLECTIONS.USER,
        },
    },
    {
        timestamps: true,
    }
);

DocumentTemplateSchema.index(
    { name: 1, version: 1 },
    { unique: true }
);

export const DocumentTemplate = mongoose.model<IDocumentTemplate>(
    COLLECTIONS.DOCUMENT_TEMPLATE,
    DocumentTemplateSchema
);