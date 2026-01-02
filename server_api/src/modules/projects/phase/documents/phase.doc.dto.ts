import { PhaseDocType } from "./phase.doc.enum";

export interface CreatePhaseDocDTO {
    type: PhaseDocType;
    phase: string;
    documentPath: string;
}

export interface GetPhaseDocDTO {
    phase: string;
}