export enum PhaseDocType {
    report = 'report',
    auxillary = 'auxillary'
}
export type PhaseDocument = {
    _id?: string;
    type: PhaseDocType;
    phase: string;
    description?: string;
    //documentPath: string;
}

export interface GetPhaseDocOptions {
    phase: string;
}