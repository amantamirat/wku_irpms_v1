import { Applicant } from "../../applicants/models/applicant.model";
import { Call } from "../../calls/models/call.model";
import { Theme } from "../../themes/models/theme.model";

export type Project = {
    _id?: string;
    call: string | Call;
    title: string;
    summary?: string;
    collaborators?: Collaborator[];
    themes?: ProjectTheme[];
    phases?: Phase[];
    createdAt?: Date;
    updatedAt?: Date;
}

export type ProjectTheme = {
    _id?: string;
    project?: string | Project;
    theme: string | Theme;
    co_pi?: string | Collaborator;
}

export type Collaborator = {
    _id?: string;
    project?: string | Project;
    applicant: string | Applicant;
    isLeadPI?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}


export enum PhaseType {
    phase = 'Phase',
    breakdown = 'Breakdown'
}


export type Phase = {
    _id?: string;
    type: PhaseType;
    project?: string | Project;
    parent?: string | Phase;
    order: number;
    duration: number;
    budget: number;
    description?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

