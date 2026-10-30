import { IStatusHistory } from "@/components/StatusHistoryWidget";
import { Activity } from "../../../activities/models/phase-activity.model";
import { Project } from "../../../models/project.model";
import { Phase } from "../../models/phase.model";
import { TransitionMap } from "@/hooks/useStateTransitionActions";

export enum PhaseDocumentType {
    progressReport = "progressReport",
    technicalReport = "technicalReport",
    financialReport = "financialReport",
    deliverable = "deliverable",
    meetingMinutes = "meetingMinutes",
    attendance = "attendance",
    photo = "photo",    
    dataset = "dataset",   
    activityEvidence = "activityEvidence",
    completionReport = "completionReport",    
    other = "other"
}

// Helper labels and descriptions for UI components
export const PhaseDocumentTypeLabels: Record<
    PhaseDocumentType,
    { label: string; description: string }
> = {
    [PhaseDocumentType.progressReport]: {
        label: "Progress Report",
        description:
            "Periodic reports documenting progress, completed tasks, achievements, challenges, and planned activities for a project phase",
    },

    [PhaseDocumentType.technicalReport]: {
        label: "Technical Report",
        description:
            "Reports presenting technical findings, research results, data analysis, methodologies, experiments, testing, and implementation outcomes",
    },

    [PhaseDocumentType.financialReport]: {
        label: "Financial Report",
        description:
            "Financial records documenting expenditures, budget utilization, financial statements, receipts, and supporting evidence of project expenses",
    },

    [PhaseDocumentType.deliverable]: {
        label: "Deliverable",
        description:
            "A tangible or digital output produced by an activity, such as infrastructure, software, equipment, prototypes, products, training materials, guidelines, or other specified project outputs",
    },

    [PhaseDocumentType.meetingMinutes]: {
        label: "Meeting Minutes",
        description:
            "Records of project meetings, coordination sessions, consultations, and focus group discussions, including participants, key discussions, decisions, and action points",
    },

    [PhaseDocumentType.attendance]: {
        label: "Attendance Sheet",
        description:
            "Attendance records identifying participants in training sessions, workshops, meetings, fieldwork, community activities, and other project events",
    },

    [PhaseDocumentType.photo]: {
        label: "Photographic Evidence",
        description:
            "Photographs documenting project activities, fieldwork, training sessions, infrastructure development, installations, deliverables, and implementation progress",
    },

    [PhaseDocumentType.dataset]: {
        label: "Dataset",
        description:
            "Structured data collected, generated, processed, or analyzed during research, surveys, experiments, monitoring, or other project activities",
    },

    [PhaseDocumentType.activityEvidence]: {
        label: "Activity Evidence",
        description:
            "Supporting evidence demonstrating that an activity was performed, such as signed records, certificates, inspection reports, test results, or other verification documents",
    },

    [PhaseDocumentType.completionReport]: {
        label: "Completion Report",
        description:
            "A final report summarizing completed work, achieved objectives, results, deliverables, challenges, and overall completion of a project phase or activity",
    },

    [PhaseDocumentType.other]: {
        label: "Other Document",
        description:
            "Any project-related document that does not fit the predefined categories; a clear description of the document is required",
    },
};

export enum ProjectDocumentStatus {
    pending = 'pending',
    approved = 'approved',
    refused = 'refused'
}

export interface ProjectDocument {
    _id?: string;
    project: string | Project;
    phase?: string | Phase | null;
    activity?: Activity | string | null;
    type: PhaseDocumentType;
    description?: string;
    documentPath?: string;
    file?: File;
    status?: ProjectDocumentStatus;
    statusHistory?: IStatusHistory<ProjectDocumentStatus>[];
}

export interface FilterPhaseDocumentOptions {
    project?: string | Project;
    phase?: string | Phase;
}


export const PROJECT_DOCUMENT_TRANSITIONS: TransitionMap = {
    [ProjectDocumentStatus.pending]: [
        {
            next: ProjectDocumentStatus.approved,
            action: "Approve",
            icon: "pi pi-check",
            severity: "success",
        },
        {
            next: ProjectDocumentStatus.refused,
            action: "Refuse",
            icon: "pi pi-times",
            severity: "danger",
            requireReason: true
        },
    ],

    [ProjectDocumentStatus.approved]: [
        {
            next: ProjectDocumentStatus.pending,
            action: "Set Pending",
            icon: "pi pi-undo",
            severity: "warning",
            requireReason: true
        },
    ],

    [ProjectDocumentStatus.refused]: [
        {
            next: ProjectDocumentStatus.pending,
            action: "Set Pending",
            icon: "pi pi-undo",
            severity: "warning",
            requireReason: true
        },
    ],
};

