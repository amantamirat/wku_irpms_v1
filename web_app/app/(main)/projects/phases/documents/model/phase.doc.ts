import { Phase } from "../../models/phase.model";


export type PhaseDocument = {
    _id?: string;
    phase: string | Phase;
    description?: string;
    documentPath?: string;
    file?: File;
}

export interface GetPhaseDocOptions {
    phase: string | Phase;
}

export const validate = (pt: PhaseDocument): { valid: boolean; message?: string } => {
    if (!pt._id) {
        if (!pt.file) {
            return { valid: false, message: 'File  is required.' };
        }
    }
    if (!pt.description) {
        return { valid: false, message: 'Description is required.' };
    }

    return { valid: true };
};


export const sanitize = (pd: Partial<PhaseDocument>): PhaseDocument => {
    return {
        ...pd,
        phase:
            typeof pd.phase === "object" && pd.phase !== null
                ? (pd.phase as any)._id
                : pd.phase,
    } as PhaseDocument;
}