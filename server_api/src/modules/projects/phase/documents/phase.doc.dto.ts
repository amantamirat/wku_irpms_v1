import { PhaseDocumentType, ProjectDocumentStatus } from "./phase.doc.model";

export interface CreatePhaseDocDTO {
    project: string;
    phase?: string;
    activity?: string;
    type: PhaseDocumentType;
    description: string;
}

export interface FilterPhaseDocDTO {
    project?: string;
    phase?: string;
    activity?: string;
    type?: PhaseDocumentType;
    status?: ProjectDocumentStatus
}