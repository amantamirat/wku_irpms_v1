import mongoose, { Document, Schema } from "mongoose";
import { COLLECTIONS } from "../../../common/constants/collections.enum";
import { IStatusHistory } from "../../../common/types/status-history";
import { createStatusHistorySchema } from "../../../common/schemas/status-history.schema";

// ============================================
// Enums
// ============================================

export enum PhaseActivityStatus {
    planned = "planned",
    approved = "approved",
    refused = "refused",
    active = "active",
    completed = "completed",
    cancelled = "cancelled",
}

export enum PhaseActivityType {
    DATA_COLLECTION = "DATA_COLLECTION",
    TRAINING_WORKSHOP = "TRAINING_WORKSHOP",
    MEETING = "MEETING",
    TRANSPORTATION = "TRANSPORTATION",
    ANALYSIS = "ANALYSIS",
    FIELD_VISIT = "FIELD_VISIT",
    DISSEMINATION = "DISSEMINATION",
    DESIGN = "DESIGN",
    OTHER = "OTHER",
}

export enum DevelopmentCategory {
    INFRASTRUCTURE = "INFRASTRUCTURE",
    REHABILITATION = "REHABILITATION",
    INSTALLATION = "INSTALLATION",
    SOFTWARE = "SOFTWARE",
    PRODUCT = "PRODUCT",
    MATERIAL = "MATERIAL",
    MEDIA = "MEDIA",
    PROCESS = "PROCESS",
    OTHER = "OTHER",
}

// ============================================
// Detail interfaces
// ============================================

export interface IPhaseActivityDetailCost {
    participants: number;
    duration: number;
    unitPrice: number;
}

export interface ILocation {
    name?: string;
    coordinates?: { lat: number; lng: number };
}

export interface IDataCollectionDetails {
    method: "SURVEY" | "INTERVIEW" | "FGD" | "OBSERVATION" | "MEASUREMENT" | "SECONDARY_DATA";
    sampleSizeTarget?: number;
    sampleSizeActual?: number;
    instrument?: string;
}

export interface ITrainingWorkshopDetails {
    targetAudience?: string;
    participantsTarget?: number;
    participantsActual?: number;
    venue?: string;
    facilitator?: string;
}

export interface IMeetingDetails {
    meetingType?: "COORDINATION" | "CONSULTATION" | "FGD" | "OTHER";
    venue?: string;
    participantsTarget?: number;
    participantsActual?: number;
}

export interface ITransportationDetails {
    transportMode?: "VEHICLE_HIRE" | "PROJECT_VEHICLE" | "PUBLIC_TRANSPORT" | "FREIGHT" | "OTHER";
    origin?: ILocation;
    destination?: ILocation;
    tripCount?: number;
    distanceKm?: number;
}

export interface IAnalysisDetails {
    analysisType?: "STATISTICAL" | "QUALITATIVE" | "FINANCIAL" | "EXPERIMENTATION" | "OTHER";
    datasetReference?: string;
    methodology?: string;
}

export interface IFieldVisitDetails {
    location?: ILocation;
    purpose?: string;
    sitesTarget?: number;
}

export interface IDisseminationDetails {
    disseminationType?: "PUBLICATION" | "PRESENTATION" | "CONFERENCE" | "PUBLIC_EVENT" | "OTHER";
    targetAudience?: string;
    venue?: string;
}

export interface IDevelopmentDetails {
    category: DevelopmentCategory;
    description?: string;
}

export interface IOtherActivityDetails {
    purpose?: string;
    additionalNotes?: string;
}

// ============================================
// Type-safe union (kind <-> details)
// ============================================

export type PhaseActivityDetails =
    | { kind: PhaseActivityType.DATA_COLLECTION; details: IDataCollectionDetails }
    | { kind: PhaseActivityType.TRAINING_WORKSHOP; details: ITrainingWorkshopDetails }
    | { kind: PhaseActivityType.MEETING; details: IMeetingDetails }
    | { kind: PhaseActivityType.TRANSPORTATION; details: ITransportationDetails }
    | { kind: PhaseActivityType.ANALYSIS; details: IAnalysisDetails }
    | { kind: PhaseActivityType.FIELD_VISIT; details: IFieldVisitDetails }
    | { kind: PhaseActivityType.DISSEMINATION; details: IDisseminationDetails }
    | { kind: PhaseActivityType.DESIGN; details: IDevelopmentDetails }
    | { kind: PhaseActivityType.OTHER; details: IOtherActivityDetails };

type PhaseActivityBase = {
    _id: mongoose.Types.ObjectId;

    project: mongoose.Types.ObjectId;
    phase: mongoose.Types.ObjectId;

    title: string;
    description?: string;

    cost: number;
    detailCost?: IPhaseActivityDetailCost | null;

    startDate: Date | null;
    endDate: Date | null;

    status: PhaseActivityStatus;
    statusHistory: IStatusHistory<PhaseActivityStatus>[];

    createdBy?: mongoose.Types.ObjectId;
    updatedBy?: mongoose.Types.ObjectId;

    createdAt?: Date;
    updatedAt?: Date;
};

export type IPhaseActivity = Document & PhaseActivityBase & PhaseActivityDetails;

// ============================================
// Sub-schemas
// ============================================

const PhaseActivityDetailCostSchema = new Schema<IPhaseActivityDetailCost>(
    {
        participants: { type: Number, required: true, min: 1 },
        duration: { type: Number, required: true, min: 0 },
        unitPrice: { type: Number, required: true, min: 0 },
    },
    { _id: false }
);

const LocationSchema = new Schema<ILocation>(
    {
        name: { type: String, trim: true },
        coordinates: {
            type: new Schema(
                {
                    lat: { type: Number, required: true, min: -90, max: 90 },
                    lng: { type: Number, required: true, min: -180, max: 180 },
                },
                { _id: false }
            ),
        },
    },
    { _id: false }
);

// Detail schemas are only used for validation, never as real collections
const detailOpts = { _id: false, autoCreate: false, autoIndex: false } as const;

const DataCollectionDetailsSchema = new Schema<IDataCollectionDetails>(
    {
        method: {
            type: String,
            required: true,
            enum: ["SURVEY", "INTERVIEW", "FGD", "OBSERVATION", "MEASUREMENT", "SECONDARY_DATA"],
        },
        sampleSizeTarget: { type: Number, min: 0 },
        sampleSizeActual: { type: Number, min: 0 },
        instrument: { type: String, trim: true },
    },
    detailOpts
);

const TrainingWorkshopDetailsSchema = new Schema<ITrainingWorkshopDetails>(
    {
        targetAudience: { type: String, trim: true },
        participantsTarget: { type: Number, min: 0 },
        participantsActual: { type: Number, min: 0 },
        venue: { type: String, trim: true },
        facilitator: { type: String, trim: true },
    },
    detailOpts
);

const MeetingDetailsSchema = new Schema<IMeetingDetails>(
    {
        meetingType: { type: String, enum: ["COORDINATION", "CONSULTATION", "FGD", "OTHER"] },
        venue: { type: String, trim: true },
        participantsTarget: { type: Number, min: 0 },
        participantsActual: { type: Number, min: 0 },
    },
    detailOpts
);

const TransportationDetailsSchema = new Schema<ITransportationDetails>(
    {
        transportMode: {
            type: String,
            enum: ["VEHICLE_HIRE", "PROJECT_VEHICLE", "PUBLIC_TRANSPORT", "FREIGHT", "OTHER"],
        },
        origin: { type: LocationSchema },
        destination: { type: LocationSchema },
        tripCount: { type: Number, min: 0 },
        distanceKm: { type: Number, min: 0 },
    },
    detailOpts
);

const AnalysisDetailsSchema = new Schema<IAnalysisDetails>(
    {
        analysisType: {
            type: String,
            enum: ["STATISTICAL", "QUALITATIVE", "FINANCIAL", "EXPERIMENTATION", "OTHER"],
        },
        datasetReference: { type: String, trim: true },
        methodology: { type: String, trim: true },
    },
    detailOpts
);

const FieldVisitDetailsSchema = new Schema<IFieldVisitDetails>(
    {
        location: { type: LocationSchema },
        purpose: { type: String, trim: true },
        sitesTarget: { type: Number, min: 0 },
    },
    detailOpts
);

const DisseminationDetailsSchema = new Schema<IDisseminationDetails>(
    {
        disseminationType: {
            type: String,
            enum: ["PUBLICATION", "PRESENTATION", "CONFERENCE", "PUBLIC_EVENT", "OTHER"],
        },
        targetAudience: { type: String, trim: true },
        venue: { type: String, trim: true },
    },
    detailOpts
);

const DevelopmentDetailsSchema = new Schema<IDevelopmentDetails>(
    {
        category: {
            type: String,
            required: true,
            enum: Object.values(DevelopmentCategory),
        },
        description: {
            type: String,
            trim: true,
            // A specific description is required for "OTHER"
            required: [
                function (this: IDevelopmentDetails) {
                    return this.category === DevelopmentCategory.OTHER;
                },
                "A description is required when the development category is OTHER",
            ],
        },
    },
    detailOpts
);

const OtherActivityDetailsSchema = new Schema<IOtherActivityDetails>(
    {
        purpose: { type: String, trim: true },
        additionalNotes: { type: String, trim: true },
    },
    detailOpts
);

// Register a validation-only model once (safe with hot reload)
const detailModel = (name: string, schema: Schema): mongoose.Model<any> =>
    (mongoose.models[name] as mongoose.Model<any>) ?? mongoose.model(name, schema);

const DETAIL_MODELS: Record<PhaseActivityType, mongoose.Model<any>> = {
    [PhaseActivityType.DATA_COLLECTION]: detailModel("_ActivityDetails_DataCollection", DataCollectionDetailsSchema),
    [PhaseActivityType.TRAINING_WORKSHOP]: detailModel("_ActivityDetails_TrainingWorkshop", TrainingWorkshopDetailsSchema),
    [PhaseActivityType.MEETING]: detailModel("_ActivityDetails_Meeting", MeetingDetailsSchema),
    [PhaseActivityType.TRANSPORTATION]: detailModel("_ActivityDetails_Transportation", TransportationDetailsSchema),
    [PhaseActivityType.ANALYSIS]: detailModel("_ActivityDetails_Analysis", AnalysisDetailsSchema),
    [PhaseActivityType.FIELD_VISIT]: detailModel("_ActivityDetails_FieldVisit", FieldVisitDetailsSchema),
    [PhaseActivityType.DISSEMINATION]: detailModel("_ActivityDetails_Dissemination", DisseminationDetailsSchema),
    [PhaseActivityType.DESIGN]: detailModel("_ActivityDetails_Design", DevelopmentDetailsSchema),
    [PhaseActivityType.OTHER]: detailModel("_ActivityDetails_Other", OtherActivityDetailsSchema),
};

// ============================================
// Main schema
// ============================================

const PhaseActivitySchema = new Schema<IPhaseActivity>(
    {
        project: {
            type: Schema.Types.ObjectId,
            ref: COLLECTIONS.PROJECT,
            required: true,
            immutable: true,
            index: true,
        },
        phase: {
            type: Schema.Types.ObjectId,
            ref: COLLECTIONS.PHASE,
            //required: true,
            //immutable: true,
            index: true,
        },

        title: { type: String, required: true, trim: true },
        description: { type: String, trim: true },

        // Discriminator for `details`
        kind: {
            type: String,
            enum: Object.values(PhaseActivityType),
            required: true,
            index: true,
        },

        // Shape depends on `kind`; validated in the pre-validate hook below
        details: {
            type: Schema.Types.Mixed,
            default: {},
        },

        cost: { type: Number, min: 0, required: true },

        detailCost: { type: PhaseActivityDetailCostSchema, required: false },

        startDate: { type: Date, required: true, default: null },
        endDate: { type: Date, required: true, default: null },

        status: {
            type: String,
            enum: Object.values(PhaseActivityStatus),
            default: PhaseActivityStatus.planned,
            required: true,
        },

        statusHistory: {
            type: [createStatusHistorySchema(Object.values(PhaseActivityStatus))],
            default: [],
        },

        createdBy: { type: Schema.Types.ObjectId, ref: COLLECTIONS.USER },
        updatedBy: { type: Schema.Types.ObjectId, ref: COLLECTIONS.USER },
    },
    { timestamps: true }
);

// Validate `details` against the schema matching `kind`.
// Unknown fields are stripped and defaults/trim are applied.
PhaseActivitySchema.pre("validate", async function () {
    if (!this.isNew && !this.isModified("details") && !this.isModified("kind")) return;

    const DetailModel = DETAIL_MODELS[this.kind as PhaseActivityType];
    if (!DetailModel) return; // the `kind` enum validator reports this

    const detailDoc = new DetailModel(this.details ?? {});

    try {
        await detailDoc.validate();
    } catch (err: any) {
        // Re-home errors under `details.*` so they show up on the activity
        for (const [path, e] of Object.entries(err.errors ?? {})) {
            this.invalidate(`details.${path}`, (e as any).message, (e as any).value);
        }
        return;
    }

    this.set("details", detailDoc.toObject({ depopulate: true, versionKey: false }));
});

PhaseActivitySchema.index({ phase: 1, title: 1 });
PhaseActivitySchema.index({ project: 1, kind: 1 });

export const PhaseActivity = mongoose.model<IPhaseActivity>(
    COLLECTIONS.ACTIVITY,
    PhaseActivitySchema
);