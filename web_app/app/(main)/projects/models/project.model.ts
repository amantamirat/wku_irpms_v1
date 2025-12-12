import { Applicant } from "../../applicants/models/applicant.model";
import { Call } from "../../calls/models/call.model";
import { Collaborator, sanitizeCollaborator } from "../collaborators/models/collaborator.model";
import { Phase, sanitizePhase } from "../phases/models/phase.model";
import { ProjectTheme, sanitizeProjectTheme } from "../themes/models/project.theme.model";

export enum ProjectStatus {
    pending = 'pending',
    closed = 'closed'
}

export type Project = {
    _id?: string;
    call?: string | Call;
    title: string;
    summary?: string;
    status?: ProjectStatus;
    leadPI?: string | Applicant;
    createdAt?: Date;
    updatedAt?: Date;
    collaborators?: Collaborator[];
    themes?: ProjectTheme[];
    phases?: Phase[];
    file?: File;
}

export interface GetProjectsOptions {
    call?: string | Call;
    leadPI?: string | Applicant;
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
    if (!project.collaborators || project.collaborators.length == 0) {
        return { valid: false, message: 'At least one collaborator is required.' };
    }
    if (!project.phases || project.phases.length === 0) {
        return { valid: false, message: 'At least one phase is required.' };
    }
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
        collaborators: project.collaborators?.map(c => sanitizeCollaborator(c)),
        themes: project.themes?.map(t => sanitizeProjectTheme(t)),
        phases: project.phases?.map(p => sanitizePhase(p)),
    };
}

export const sanitizeGetProjectsOptions = (options: Partial<GetProjectsOptions>): Partial<GetProjectsOptions> => {
    return {
        ...options,
        call:
            typeof options.call === 'object' && options.call !== null
                ? (options.call as Call)._id
                : options.call,
    };
};


