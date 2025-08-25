import { Applicant } from "../../applicants/models/applicant.model";
import { Call } from "../../calls/models/call.model";
import { Theme } from "../../themes/models/theme.model";

export type Project = {
    _id?: string;
    call: string | Call;
    title: string;
    summary?: string;
    collaborators?: Collaborator[];
    themes?: ProjectThemes[];    
    phases?:Phase[];
    createdAt?: Date;
    updatedAt?: Date;
}

export type ProjectThemes={
    _id?: string;
    project?: string | Project;
    theme: string | Theme;
}

export type Collaborator = {
    _id?: string;
    project?: string | Project;
    applicant: string | Applicant;
    isLeadPI?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

export type Phase = {
    _id?: string;
    project?: string | Project;
    phase: number;    
    duration: number;
    budget:number;
    description?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

