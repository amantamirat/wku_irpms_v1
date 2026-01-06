import mongoose, { Schema, Document } from "mongoose";
import { COLLECTIONS } from "../../../common/constants/collections.enum";

export enum PublicationType {
    JournalArticle = "Journal Article",
    ConferencePaper = "Conference Paper",
    BookChapter = "Book Chapter",
    Book = "Book",
    Thesis = "Thesis / Dissertation",
    TechnicalReport = "Technical Report",
    Patent = "Patent",
    MagazineArticle = "Magazine Article",
    WhitePaper = "White Paper",
    Poster = "Poster",
    Preprint = "Preprint",
    Software = "Software",
    Other = "Other",
}

export interface IPublication extends Document {
    applicant: mongoose.Types.ObjectId;
    title: string;
    type: PublicationType;
    abstract?: string;
    publishedDate?: Date;
    doi?: string;
    url?: string;
    publisher?: string;
    publicationId?: string;
    document?: {
        filename: string;
        path: string;
        mimetype: string;
        size: number;
    };
}

const PublicationSchema = new Schema<IPublication>(
    {
        applicant: {
            type: Schema.Types.ObjectId,
            ref: COLLECTIONS.APPLICANT,
            required: true,
            index: true,
        },

        title: {
            type: String,
            required: true,
            trim: true,
        },

        type: {
            type: String,
            enum: Object.values(PublicationType),
            required: true,
            immutable: true,
        },

        abstract: {
            type: String,
            trim: true,
        },

        publishedDate: {
            type: Date,
        },

        doi: {
            type: String,
            trim: true,
            unique:true
        },

        url: {
            type: String,
            trim: true,
        },

        publisher: {
            type: String,
            trim: true,
        },

        publicationId: {
            type: String,
            trim: true,
        },

        document: {
            filename: String,
            path: String,
            mimetype: String,
            size: Number,
        },
    },
    {
        timestamps: true,
    }
);

export const Publication = mongoose.model<IPublication>(
    COLLECTIONS.PUBLICATION,
    PublicationSchema
);
