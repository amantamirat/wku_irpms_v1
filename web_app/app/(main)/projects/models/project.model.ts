import { Applicant } from "../../applicants/models/applicant.model";
import { Call } from "../../calls/models/call.model";
import { Theme } from "../../themes/models/theme.model";
import { User } from "../../users/models/user.model";

export enum ProjectStatus {
    pending = 'pending',
    closed = 'closed'
}

export type Project = {
    _id?: string;
    call: string | Call;
    title: string;
    summary?: string;
    collaborators?: Collaborator[];
    themes?: ProjectTheme[];
    phases?: Phase[];
    status?: ProjectStatus;
    createdBy?: string | User;
    createdAt?: Date;
    updatedAt?: Date;
}

export type ProjectTheme = {
    _id?: string;
    project?: string | Project;
    theme: string | Theme;
    Co_PI?: string | Collaborator;
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


export const validateProject = (project: Project): { valid: boolean; message?: string } => {
    if (!project.call) {
        return { valid: false, message: 'Call is required.' };
    }
    if (!project.title || project.title.trim().length === 0) {
        return { valid: false, message: 'Title is required.' };
    }
    return { valid: true };
};
