import { PhaseDocumentType } from "./phase.doc.model";

export interface CreatePhaseDocDTO {
    phase: string;
    type: PhaseDocumentType;
    description: string;
}

export interface FilterPhaseDocDTO {
    phase?: string;
    type?: PhaseDocumentType;
}