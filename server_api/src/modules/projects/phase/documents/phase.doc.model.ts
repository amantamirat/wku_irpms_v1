import mongoose, { Schema } from "mongoose";
import { COLLECTIONS } from "../../../../common/constants/collections.enum";
import { IStatusHistory } from "../../../../common/types/status-history";
import { createStatusHistorySchema } from "../../../../common/schemas/status-history.schema";

export enum PhaseDocumentType {
    progressReport = "progressReport",       // phase level
    technicalReport = "technicalReport",     // activity level
    financialReport = "financialReport",     // activity
    activityEvidence = "activityEvidence",   // activity
    deliverable = "deliverable",             // activity
    meetingMinutes = "meetingMinutes",       // activity
    attendance = "attendance",               // activity
    photo = "photo",                         // activity
    dataset = "dataset",                     // activity
    //externalReviewResult = "externalReviewResult", // project level
    demandRequest = "demandRequest",         // project level (support letter / proof of need)
    completionReport = "completionReport",   // project level
    other = "other"                          // project level
}

export enum DocumentScope {
    project = "project",
    phase = "phase",
    activity = "activity"
}

// Record<> forces a compile error if a new type is added without a scope
export const DOCUMENT_TYPE_SCOPE: Record<PhaseDocumentType, DocumentScope> = {
    [PhaseDocumentType.progressReport]: DocumentScope.phase,

    [PhaseDocumentType.technicalReport]: DocumentScope.activity,
    [PhaseDocumentType.financialReport]: DocumentScope.activity,
    [PhaseDocumentType.activityEvidence]: DocumentScope.activity,
    [PhaseDocumentType.deliverable]: DocumentScope.activity,
    [PhaseDocumentType.meetingMinutes]: DocumentScope.activity,
    [PhaseDocumentType.attendance]: DocumentScope.activity,
    [PhaseDocumentType.photo]: DocumentScope.activity,
    [PhaseDocumentType.dataset]: DocumentScope.activity,

    [PhaseDocumentType.demandRequest]: DocumentScope.project,
    [PhaseDocumentType.completionReport]: DocumentScope.project,
    [PhaseDocumentType.other]: DocumentScope.project,
};

export enum ProjectDocumentStatus {
    pending = 'pending',
    approved = 'approved',
    refused = 'refused'
}

export interface IProjectDocument extends mongoose.Document {
    project: mongoose.Types.ObjectId;
    phase?: mongoose.Types.ObjectId;
    activity?: mongoose.Types.ObjectId;

    type: PhaseDocumentType;
    description: string;
    documentPath: string;

    status: ProjectDocumentStatus;
    statusHistory: IStatusHistory<ProjectDocumentStatus>[];

    createdBy?: mongoose.Types.ObjectId;
    updatedBy?: mongoose.Types.ObjectId;

    createdAt?: Date;
    updatedAt?: Date;
}

const ProjectDocSchema = new Schema<IProjectDocument>({
    project: {
        type: Schema.Types.ObjectId,
        ref: COLLECTIONS.PROJECT,
        required: true,
        immutable: true,
        index: true
    },

    phase: {
        type: Schema.Types.ObjectId,
        ref: COLLECTIONS.PHASE,
        index: true
    },

    activity: {
        type: Schema.Types.ObjectId,
        ref: COLLECTIONS.ACTIVITY,
        index: true
    },

    type: {
        type: String,
        enum: Object.values(PhaseDocumentType),
        required: true
    },

    description: {
        type: String,
        required: true,
        trim: true
    },

    documentPath: {
        type: String,
        required: true
    },

    status: {
        type: String,
        enum: Object.values(ProjectDocumentStatus),
        default: ProjectDocumentStatus.pending,
        required: true,
    },

    statusHistory: {
        type: [createStatusHistorySchema(
            Object.values(ProjectDocumentStatus)
        )],
        default: []
    },

    createdBy: {
        type: Schema.Types.ObjectId,
        ref: COLLECTIONS.USER
    },

    updatedBy: {
        type: Schema.Types.ObjectId,
        ref: COLLECTIONS.USER
    }
}, { timestamps: true });

export const ProjectDocument = mongoose.model<IProjectDocument>(
    COLLECTIONS.PHASE_DOCUMENT,
    ProjectDocSchema
);