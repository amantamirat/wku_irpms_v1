import { IStatusHistory } from "@/components/StatusHistoryWidget";
import { Application } from "../../applications/models/application.model";
import { Calendar } from "../../calendars/models/calendar.model";
import { Call } from "../../calls/models/call.model";
import { Collaborator } from "../../collaborators/models/collaborator.model";
import { Grant } from "../../grants/models/grant.model";
import { Organization } from "../../organizations/models/organization.model";
import { Theme } from "../../thematics/themes/models/theme.model";
import { User } from "../../users/models/user.model";
import { Verification } from "../../verifications/models/verification.model";
import { Phase } from "../phases/models/phase.model";

export enum ProjectStatus {
    draft = 'draft',
    approved = 'approved',
    refused = 'refused',
    granted = 'granted',
    completed = 'completed',
    terminated = 'terminated',
    verified = 'verified'
}

export interface IProjectObjectives {
    general: string;
    specific: string[];
}

export type Project = {
    _id?: string;
    grant?: string | Grant;
    calendar?: string | Calendar;
    call?: string | Call;
    organization?: string | Organization;
    workspace?: string | Organization;
    title: string;
    summary?: string;
    keywords?: string[];
    objectives?: IProjectObjectives;
    status?: ProjectStatus;
    leadPI?: string | User;
    totalBudget?: number;
    totalDuration?: number;
    totalCollabs?: number;
    themes?: Theme[] | string[];
    createdAt?: Date;
    updatedAt?: Date;
    collaborators?: Collaborator[];
    phases?: Phase[];
    file?: File;
    statusHistory?: IStatusHistory<ProjectStatus>[];
    currentApplication?: string | Application;
    currentVerification?: string | Verification;
    lockLead?: boolean;
}

export interface FilterProjects {
    grant?: string | Grant;
    leadPI?: string | User;
    call?: string | Call;
    workspace?: string | Organization;
    calendar?: string | Calendar;
    status?: ProjectStatus;
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
    if (!result.valid) return result;

    if (!project.file) {
        return { valid: false, message: 'Please select a project file.' };
    }
    return { valid: true };
};