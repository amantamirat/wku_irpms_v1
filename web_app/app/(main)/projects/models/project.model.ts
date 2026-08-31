import { Application } from "../../applications/models/application.model";
import { Calendar } from "../../calendars/models/calendar.model";
import { Call } from "../../calls/models/call.model";
import { Collaborator, sanitizeCollaborator } from "../../collaborators/models/collaborator.model";
import { Grant } from "../../grants/models/grant.model";
import { Organization } from "../../organizations/models/organization.model";
import { Theme } from "../../thematics/themes/models/theme.model";
import { User } from "../../users/models/user.model";
import { Verification } from "../../verifications/models/verification.model";
import { Phase, sanitizePhase } from "../phases/models/phase.model";

export enum ProjectStatus {
    draft = 'draft',
    submitted = "submitted",
    rejected = "rejected",
    accepted = "accepted",
    approved = "approved",//in this the budget and duration will be modified
    granted = "granted",
    refused = 'refused',
    active = "active",
    terminated = 'terminated',
    completed = 'completed'
}

export type Project = {
    _id?: string;
    grant?: string | Grant;
    calendar?: string | Calendar;
    call?: string | Call;
    title: string;
    summary?: string;
    status?: ProjectStatus;
    leadPI?: string | User;
    totalBudget?: number;
    totalDuration?: number;
    totalCollabs?: number;
    themes?: Theme[] | string[];
    //currentStage?: string;
    createdAt?: Date;
    updatedAt?: Date;
    //used for apply for call
    collaborators?: Collaborator[];// | string[];
    phases?: Phase[];
    file?: File;
    currentApplication?: string | Application;
    currentVerification?: string | Verification;
    //workspace?: string | Organization;
}

export interface FilterProjects {
    grant?: string | Grant;
    leadPI?: string | User;
    call?: string | Call;
    workspace?: string | Organization;
    calendar?: string|Calendar;
    //populate?: boolean;
}

export const validateProject = (project: Project): { valid: boolean; message?: string } => {
    if (!project.grant) {
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

/*
export const sanitize = (project: Partial<Project>): Partial<Project> => {
    return {
        ...project,
        grant:
            typeof project.grant === 'object' && project.grant !== null
                ? (project.grant as any)._id
                : project.grant,
        leadPI:
            typeof project.leadPI === 'object' && project.leadPI !== null
                ? (project.leadPI as any)._id
                : project.leadPI,
        calendar:
            typeof project.calendar === 'object' && project.calendar !== null
                ? (project.calendar as any)._id
                : project.calendar,
        call:
            typeof project.call === 'object' && project.call !== null
                ? (project.call as any)._id
                : project.call,
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
*/

