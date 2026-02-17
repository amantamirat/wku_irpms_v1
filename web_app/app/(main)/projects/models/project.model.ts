import { Applicant } from "../../applicants/models/applicant.model";
import { Call } from "../../calls/models/call.model";
import { Organization } from "../../organizations/models/organization.model";
import { Collaborator, sanitizeCollaborator } from "../collaborators/models/collaborator.model";
import { Phase, sanitizePhase } from "../phases/models/phase.model";
import { ProjectTheme, sanitizeProjectTheme } from "../themes/models/project.theme.model";

export enum ProjectStatus {
    pending = 'pending',
    submitted = "submitted",
    rejected = "rejected",
    accepted = "accepted",
    negotiation = "negotiation",
    approved = "approved",
    granted = "granted",
    completed = 'completed'
}

export type Project = {
    _id?: string;
    call?: string | Call;
    title: string;
    summary?: string;
    status?: ProjectStatus;
    applicant?: string | Applicant;
    totalBudget?: number;
    totalDuration?: number;
    createdAt?: Date;
    updatedAt?: Date;
    collaborators?: Collaborator[];// | string[];
    themes?: ProjectTheme[];// | string[];
    phases?: Phase[];
    file?: File;
    workspace?: string | Organization;
}

export interface GetProjectsOptions {
    call?: string | Call;
    applicant?: string | Applicant;
    workspace?: string | Organization;
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

export const validateApplyProject = (project: Project): { valid: boolean; message?: string } => {
    const result = validateProject(project);
    if (!result.valid) return result
    /*
    if (!project.collaborators || project.collaborators.length == 0) {
        return { valid: false, message: 'At least one collaborator is required.' };
    }
    if (!project.phases || project.phases.length === 0) {
        return { valid: false, message: 'At least one phase is required.' };
    }
    */
    if (!project.file) {
        return { valid: false, message: 'Please select a project file.' };
    }
    return { valid: true };
};


export const sanitizeProject = (project: Partial<Project>): Partial<Project> => {
    return {
        ...project,
        call:
            typeof project.call === 'object' && project.call !== null
                ? (project.call as Call)._id
                : project.call,
        applicant:
            typeof project.applicant === 'object' && project.applicant !== null
                ? (project.applicant as any)._id
                : project.applicant,
        workspace:
            typeof project.workspace === 'object' && project.workspace !== null
                ? (project.workspace as any)._id
                : project.workspace,
        collaborators: project.collaborators?.map(c => sanitizeCollaborator(c)),
        themes: project.themes?.map(t => sanitizeProjectTheme(t)),
        phases: project.phases?.map(p => sanitizePhase(p)),
    };
}


