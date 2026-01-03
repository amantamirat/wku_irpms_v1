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
    file?: File;
}

export interface GetPhaseDocOptions {
    phase: string;
}