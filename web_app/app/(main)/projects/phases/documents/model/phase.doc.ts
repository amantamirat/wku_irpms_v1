import { Phase } from "../../models/phase.model";

export enum PhaseDocumentType {
    plan = "plan",
    progressReport = "progressReport",
    technicalReport = "technicalReport",
    financialReport = "financialReport",
    activityEvidence = "activityEvidence",
    deliverable = "deliverable",
    meetingMinutes = "meetingMinutes",
    attendance = "attendance",
    photo = "photo",
    dataset = "dataset",
    completionReport = "completionReport",
    other = "other"
}

// Helper labels and descriptions for UI components
export const PhaseDocumentTypeLabels: Record<PhaseDocumentType, { label: string; description: string }> = {
    [PhaseDocumentType.plan]: { label: "Work Plan", description: "Phase work plan, implementation schedule" },
    [PhaseDocumentType.progressReport]: { label: "Progress Report", description: "Monthly/quarterly phase progress report" },
    [PhaseDocumentType.technicalReport]: { label: "Technical Report", description: "Technical findings, analysis, methodology" },
    [PhaseDocumentType.financialReport]: { label: "Financial Report", description: "Phase expenditure/financial report" },
    [PhaseDocumentType.activityEvidence]: { label: "Activity Evidence", description: "Evidence that an activity was actually performed" },
    [PhaseDocumentType.deliverable]: { label: "Deliverable", description: "Specific output produced by the phase" },
    [PhaseDocumentType.meetingMinutes]: { label: "Meeting Minutes", description: "Minutes from project/phase meetings" },
    [PhaseDocumentType.attendance]: { label: "Attendance Sheet", description: "Training, workshop, fieldwork attendance" },
    [PhaseDocumentType.photo]: { label: "Photo", description: "Fieldwork/activity photographs" },
    [PhaseDocumentType.dataset]: { label: "Dataset", description: "Data collected/generated during the phase" },
    [PhaseDocumentType.completionReport]: { label: "Completion Report", description: "Final report demonstrating project completion" },
    [PhaseDocumentType.other]: { label: "Other", description: "Anything that doesn't fit the categories" }
};

export type PhaseDocument = {
    _id?: string;
    phase: string | Phase;
    type: PhaseDocumentType;
    description?: string;
    documentPath?: string;
    file?: File;
}

export interface FilterPhaseDocOptions {
    phase: string | Phase;
}

export const validate = (pt: PhaseDocument): { valid: boolean; message?: string } => {
    if (!pt._id && !pt.file) {
        return { valid: false, message: 'File is required.' };
    }
    if (!pt.type) {
        return { valid: false, message: 'Document type is required.' };
    }
    if (!pt.description) {
        return { valid: false, message: 'Description is required.' };
    }

    return { valid: true };
};