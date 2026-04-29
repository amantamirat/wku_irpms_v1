import { User } from "../../users/models/user.model";
import { Call } from "../../calls/models/call.model";
import { GrantAllocation } from "../../grants/allocations/models/grant.allocation.model";
import { Grant } from "../../grants/models/grant.model";
import { Organization } from "../../organizations/models/organization.model";
import { sanitizeTheme, Theme } from "../../thematics/themes/models/theme.model";
import { Collaborator, sanitizeCollaborator } from "../collaborators/models/collaborator.model";
import { Phase, sanitizePhase } from "../phases/models/phase.model";

export enum ProjectStatus {
    draft = 'draft',
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
    grantAllocation?: string | GrantAllocation;
    call?: string | Call;
    title: string;
    summary?: string;
    status?: ProjectStatus;
    applicant?: string | User;
    totalBudget?: number;
    totalDuration?: number;
    themes?: Theme[] | string[];
    createdAt?: Date;
    updatedAt?: Date;
    
    //used for apply for call
    collaborators?: Collaborator[];// | string[];
    phases?: Phase[];
    file?: File;
    //workspace?: string | Organization;
}

export interface GetProjectsOptions {
    grantAllocation?: string | GrantAllocation;
    applicant?: string | User;
    workspace?: string | Organization;
    calendar?: string;
    grant?: string;
    populate?: boolean;
}

export const validateProject = (project: Project): { valid: boolean; message?: string } => {
    if (!project.grantAllocation) {
        return { valid: false, message: 'Grant is required.' };
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


export const sanitize = (project: Partial<Project>): Partial<Project> => {
    return {
        ...project,
        grantAllocation:
            typeof project.grantAllocation === 'object' && project.grantAllocation !== null
                ? (project.grantAllocation as any)._id
                : project.grantAllocation,
        applicant:
            typeof project.applicant === 'object' && project.applicant !== null
                ? (project.applicant as any)._id
                : project.applicant,
        /*
                workspace:
            typeof project.workspace === 'object' && project.workspace !== null
                ? (project.workspace as any)._id
                : project.workspace,
                */
        // --- Fix for Themes Array ---
        themes: project.themes?.map(t => {
            // If the theme is an object, take the _id, otherwise return the string/id as is
            if (typeof t === 'object' && t !== null) {
                return (t as any)._id;
            }
            return t;
        }).filter(t => !!t),
        collaborators: project.collaborators?.map(c => sanitizeCollaborator(c)),
        phases: project.phases?.map(p => sanitizePhase(p)),
    };
}


