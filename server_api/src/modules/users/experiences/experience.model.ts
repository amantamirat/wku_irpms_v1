//experience.model.ts
import mongoose, { model, Schema, Document } from "mongoose";
import { COLLECTIONS } from "../../../common/constants/collections.enum";
import { IStatusHistory } from "../../../common/types/status-history";
import { createStatusHistorySchema } from "../../../common/schemas/status-history.schema";

export enum ExperienceStatus {
    PENDING = 'pending',
    VERIFIED = 'verified'
}

export enum EmploymentType {
    FullTime = "Full-Time",
    PartTime = "Part-Time",
    Contract = "Contract",
    Internship = "Internship",
    Volunteer = "Volunteer"
}

// Mongo model interface
export interface IExperience extends Document {
    user: mongoose.Types.ObjectId;
    organization: mongoose.Types.ObjectId;
    position: mongoose.Types.ObjectId;
    rank: mongoose.Types.ObjectId;
    startDate: Date;
    endDate: Date | null;
    isCurrent?: boolean;
    employmentType: EmploymentType;

    status: ExperienceStatus;
    statusHistory: IStatusHistory<ExperienceStatus>[];

    createdBy?: mongoose.Types.ObjectId;
    updatedBy?: mongoose.Types.ObjectId;
    createdAt?: Date;
    updatedAt?: Date;
}

// Mongoose Schema
const ExperienceSchema = new Schema<IExperience>({
    user: {
        type: Schema.Types.ObjectId,
        ref: COLLECTIONS.USER,
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
        ref: COLLECTIONS.POSITION,
        required: true,
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

    status: {
        type: String,
        enum: Object.values(ExperienceStatus),
        default: ExperienceStatus.PENDING,
    },

    statusHistory: {
        type: [createStatusHistorySchema(Object.values(ExperienceStatus))],
        default: []
    },

    createdBy: {
        type: Schema.Types.ObjectId,
        ref: COLLECTIONS.USER,
    },

    updatedBy: {
        type: Schema.Types.ObjectId,
        ref: COLLECTIONS.USER,
    },
}, { timestamps: true });


export const Experience = model<IExperience>(COLLECTIONS.EXPERIENCE, ExperienceSchema);
