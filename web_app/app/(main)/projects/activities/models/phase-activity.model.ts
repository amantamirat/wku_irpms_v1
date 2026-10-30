
import { Project } from "../../models/project.model";
import { Phase } from "../../phases/models/phase.model";

// ============================================
// Activity Status
// ============================================

export enum ActivityStatus {
    planned = "planned",
    approved = "approved",
    refused = "refused",
    active = "active",
    completed = "completed",
    cancelled = "cancelled",
}

// ============================================
// Activity Types
// ============================================

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

// ============================================
// Activity Type Labels and Descriptions
// ============================================

export const PhaseActivityTypeLabels: Record<
    PhaseActivityType,
    { label: string; description: string }
> = {
    [PhaseActivityType.DATA_COLLECTION]: {
        label: "Data Collection",
        description:
            "Surveys, structured interviews, focus group discussions (FGDs), observations, and empirical field measurements",
    },

    [PhaseActivityType.TRAINING_WORKSHOP]: {
        label: "Training & Workshop",
        description:
            "Capacity building, practical instruction sessions, participatory workshops, and stakeholder engagement to build skills and strengthen institutional or community capacity",
    },

    [PhaseActivityType.MEETING]: {
        label: "Meeting",
        description:
            "Project steering, stakeholder coordination, stakeholder consultations, and review meetings",
    },

    [PhaseActivityType.TRANSPORTATION]: {
        label: "Transportation",
        description:
            "Logistics for project staff, participants, equipment, and materials, including vehicle hire, fuel costs, public transport, freight, and travel-related services",
    },

    [PhaseActivityType.ANALYSIS]: {
        label: "Analysis",
        description:
            "Data processing, statistical modeling, qualitative interpretation, and synthesis of research findings",
    },

    [PhaseActivityType.FIELD_VISIT]: {
        label: "Field Visit",
        description:
            "Site inspections, field monitoring, project supervision, and physical verification visits",
    },

    [PhaseActivityType.DISSEMINATION]: {
        label: "Dissemination",
        description:
            "Sharing project outcomes and research findings through publications, academic presentations, conferences, and stakeholder public events",
    },

    [PhaseActivityType.DESIGN]: {
        label: "Design & Implementation",
        description:
            "Developing, prototyping, building, or implementing physical infrastructure, products, materials, software systems, or other tangible and digital deliverables",
    },

    [PhaseActivityType.OTHER]: {
        label: "Other",
        description:
            "Project activities that do not fit predefined categories, including specialized professional services, technical reports, and progress reporting",
    },
};

// ============================================
// Activity Cost Details
// ============================================

export interface IActivityDetailCost {
    duration: number;
    participants: number;
    unitPrice: number;
}

// ============================================
// Activity-Specific Details
// ============================================

// Data collection
export interface IDataCollectionDetails {
    method:
    | "SURVEY"
    | "INTERVIEW"
    | "FGD"
    | "OBSERVATION"
    | "MEASUREMENT"
    | "SECONDARY_DATA";

    sampleSizeTarget?: number;
    sampleSizeActual?: number;
    instrument?: string;
}

// Training and workshop share the same details
export interface ITrainingWorkshopDetails {
    targetAudience?: string;
    participantsTarget?: number;
    participantsActual?: number;
    venue?: string;
    facilitator?: string;
}

// Meeting
export interface IMeetingDetails {
    meetingType?: "COORDINATION" | "CONSULTATION" | "FGD" | "OTHER";
    venue?: string;
    participantsTarget?: number;
    participantsActual?: number;
}

export interface Location {
    name?: string;
    coordinates?: { lat: number; lng: number };
};

// Transportation
export interface ITransportationDetails {
    transportMode?:
    | "VEHICLE_HIRE"
    | "PROJECT_VEHICLE"
    | "PUBLIC_TRANSPORT"
    | "FREIGHT"
    | "OTHER";

    origin?: Location;
    destination?: Location;
    tripCount?: number;
    distanceKm?: number;
}

// Analysis
export interface IAnalysisDetails {
    analysisType?: "STATISTICAL" | "QUALITATIVE" | "FINANCIAL" | "EXPERIMENTATION" | "OTHER";
    datasetReference?: string;
    methodology?: string;
}

// Report writing
export interface IReportDetails {
    reportType?:
    | "INTERIM"
    | "FINAL"
    | "POLICY_BRIEF"
    | "ARTICLE"
    | "TECHNICAL"
    | "OTHER";

    version?: string;
}

// Field visit
export interface IFieldVisitDetails {
    location?: Location;
    purpose?: string;
    sitesTarget?: number;
}

// Dissemination
export interface IDisseminationDetails {
    disseminationType?:
    | "PUBLICATION"
    | "PRESENTATION"
    | "CONFERENCE"
    | "PUBLIC_EVENT"
    | "OTHER";

    targetAudience?: string;
    venue?: string;
}

export enum DevelopmentCategory {
    INFRASTRUCTURE = "INFRASTRUCTURE",       // building, road, water point, irrigation
    REHABILITATION = "REHABILITATION",       // repair or upgrade of existing structure
    INSTALLATION = "INSTALLATION",           // solar panels, lab equipment, networks
    SOFTWARE = "SOFTWARE",                   // web app, mobile app, system, database, algotihm
    PRODUCT = "PRODUCT",                     // prototype, device, improved variety
    MATERIAL = "MATERIAL",                   // training manual, guideline, toolkit, brochure
    MEDIA = "MEDIA",                         // video, audio, infographic, website content
    PROCESS = "PROCESS",                     // protocol, SOP, framework, methodology
    OTHER = "OTHER",
}

export const ImplementationCategoryLabels: Record<
    DevelopmentCategory,
    { label: string; description: string }
> = {
    [DevelopmentCategory.INFRASTRUCTURE]: {
        label: "Infrastructure Development",
        description:
            "Construction and development of physical infrastructure, including buildings, roads, water points, irrigation systems, and other public or institutional facilities",
    },

    [DevelopmentCategory.REHABILITATION]: {
        label: "Rehabilitation & Improvement",
        description:
            "Repairing, renovating, upgrading, or restoring existing buildings, infrastructure, equipment, systems, or facilities to improve their condition or functionality",
    },

    [DevelopmentCategory.INSTALLATION]: {
        label: "Installation",
        description:
            "Installing, configuring, and commissioning equipment, solar panels, laboratory instruments, communication networks, machinery, and other technical systems",
    },

    [DevelopmentCategory.SOFTWARE]: {
        label: "Software & Digital Systems",
        description:
            "Designing, developing, testing, or improving software applications, websites, mobile apps, databases, algorithms, information systems, and other digital solutions",
    },

    [DevelopmentCategory.PRODUCT]: {
        label: "Product & Prototype Development",
        description:
            "Designing, creating, adapting, or improving physical products, prototypes, devices, tools, technologies, and new or improved varieties",
    },

    [DevelopmentCategory.MATERIAL]: {
        label: "Educational & Informational Materials",
        description:
            "Developing training manuals, guidelines, toolkits, brochures, instructional resources, learning materials, and other printed or digital documents",
    },

    [DevelopmentCategory.MEDIA]: {
        label: "Media & Digital Content",
        description:
            "Creating or editing videos, audio recordings, photographs, infographics, animations, and other communication or multimedia content",
    },

    [DevelopmentCategory.PROCESS]: {
        label: "Process & Methodology Development",
        description:
            "Developing or improving procedures, standard operating procedures (SOPs), protocols, frameworks, methodologies, workflows, and operational guidelines",
    },

    [DevelopmentCategory.OTHER]: {
        label: "Other Development",
        description:
            "Development, implementation, or improvement work that does not fit the predefined categories; a specific description is required",
    },
};


export interface IDevelopmentDetails {
    kind: PhaseActivityType.DESIGN;
    category: DevelopmentCategory;
    description?: string;
}

// Other
export interface IOtherActivityDetails {
    purpose?: string;
    additionalNotes?: string;
}

// ============================================
// Type-Safe Activity Details
// ============================================

export type PhaseActivityDetails =
    | {
        kind: PhaseActivityType.DATA_COLLECTION;
        details: IDataCollectionDetails;
    }
    | {
        kind:
        | PhaseActivityType.TRAINING_WORKSHOP;
        details: ITrainingWorkshopDetails;
    }
    | {
        kind: PhaseActivityType.MEETING;
        details: IMeetingDetails;
    }
    | {
        kind: PhaseActivityType.TRANSPORTATION;
        details: ITransportationDetails;
    }
    | {
        kind: PhaseActivityType.ANALYSIS;
        details: IAnalysisDetails;
    }
    | {
        kind: PhaseActivityType.FIELD_VISIT;
        details: IFieldVisitDetails;
    }
    | {
        kind: PhaseActivityType.DISSEMINATION;
        details: IDisseminationDetails;
    }
    | {
        kind: PhaseActivityType.DESIGN;
        details: IDevelopmentDetails;
    }
    | {
        kind: PhaseActivityType.OTHER;
        details: IOtherActivityDetails;
    };

// ============================================
// Activity Model
// ============================================

type ActivityBase = {
    _id?: string;

    project?: string | Project;
    phase?: string | Phase;

    title: string;
    description?: string;

    cost: number;
    detailCost?: IActivityDetailCost;

    startDate?: Date;
    endDate?: Date;

    status?: ActivityStatus;

    createdAt?: Date;
    updatedAt?: Date;
};

export type Activity = ActivityBase & PhaseActivityDetails;

// ============================================
// Activity Filters
// ============================================

export interface FilterActivitiesOptions {
    project?: string | Project;
    phase?: string | Phase;
    status?: ActivityStatus;
    activityType?: PhaseActivityType;
}
