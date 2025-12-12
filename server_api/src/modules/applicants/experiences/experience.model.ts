//experience.model.ts
import mongoose, { model, Schema, Document } from "mongoose";
import { COLLECTIONS } from "../../../common/constants/collections.enum";
import { Rank } from "../positions/position.model";
import EmploymentType  from "./employment-type.enum";


// Mongo model interface
export interface IExperience extends Document {
    applicant: mongoose.Types.ObjectId;
    jobTitle?: string;
    organization: mongoose.Types.ObjectId;
    rank: mongoose.Types.ObjectId;
    startDate: Date;
    endDate?: Date | null;
    isCurrent: boolean;
    employmentType: EmploymentType;
    createdAt?: Date;
    updatedAt?: Date;
}

// Mongoose Schema
const ExperienceSchema = new Schema<IExperience>({
    applicant: {
        type: Schema.Types.ObjectId,
        ref: COLLECTIONS.APPLICANT,
        required: true,
        immutable: true
    },
    jobTitle: {
        type: String,
        trim: true
    },
    organization: {
        type: Schema.Types.ObjectId,
        ref: COLLECTIONS.ORGANIZATION,
        required: true
    },
    rank: {
        type: Schema.Types.ObjectId,
        ref: Rank.modelName,
        required: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        default: null
    },
    isCurrent: {
        type: Boolean,
        required: true
    },
    employmentType: {
        type: String,
        enum: Object.values(EmploymentType),
        required: true
    },
}, { timestamps: true });

// Optional: unique index to prevent duplicate active experiences per applicant
// ExperienceSchema.index({ applicant: 1, jobTitle: 1, organization: 1, startDate: 1 }, { unique: true });

export const Experience = model<IExperience>(COLLECTIONS.EXPERIENCE, ExperienceSchema);
