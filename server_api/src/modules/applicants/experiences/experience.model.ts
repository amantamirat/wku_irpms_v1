//experience.model.ts
import mongoose, { model, Schema, Document } from "mongoose";
import { COLLECTIONS } from "../../../common/constants/collections.enum";
import { Position, Rank } from "../positions/position.model";

export enum EmploymentType {
    FullTime = "Full-Time",
    PartTime = "Part-Time",
    Contract = "Contract",
    Internship = "Internship",
    Volunteer = "Volunteer"
}

// Mongo model interface
export interface IExperience extends Document {
    applicant: mongoose.Types.ObjectId;
    organization: mongoose.Types.ObjectId;
    position: mongoose.Types.ObjectId;
    rank: mongoose.Types.ObjectId;
    startDate: Date;
    endDate: Date | null;
    isCurrent?: boolean;
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
    organization: {
        type: Schema.Types.ObjectId,
        ref: COLLECTIONS.ORGANIZATION,
        required: true
    },
    position: {
        type: Schema.Types.ObjectId,
        ref: Position.modelName,
        required: true,
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
    },
    employmentType: {
        type: String,
        enum: Object.values(EmploymentType),
        required: true
    },
}, { timestamps: true });


export const Experience = model<IExperience>(COLLECTIONS.EXPERIENCE, ExperienceSchema);
