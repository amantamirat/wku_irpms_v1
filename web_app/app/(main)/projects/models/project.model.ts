import { Call } from "../../calls/models/call.model";
import { User } from "../../users/models/user.model";
import { Collaborator } from "../collaborators/models/collaborator.model";
import { Phase } from "../phases/models/phase.model";
import { ProjectTheme } from "../themes/models/project.theme.model";

export enum ProjectStatus {
    pending = 'pending',
    closed = 'closed'
}

export type Project = {
    _id?: string;
    call: string | Call;
    title: string;
    summary?: string;    
    status?: ProjectStatus;
    createdBy?: string | User;
    createdAt?: Date;
    updatedAt?: Date;
    collaborators?: Collaborator[];
    themes?: ProjectTheme[];
    phases?: Phase[];
    file?: File;
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
    if(!result.valid) return result
    if(!project.collaborators || project.collaborators.length==0){
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
