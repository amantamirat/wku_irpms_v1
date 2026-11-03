// project-stage.dto.ts
import { ApplicationStatus } from "./application.model";



export interface CreateApplicationDTO {
    project: string;
    stage: string;
}


export interface FilterApplicationDTO {
    reviewerAssigner?:string;
    project?: string;
    projectIds?: string[];

    grantIds?: string[];
    organizationIds?: string[];
    workspaceIds?: string[];

    stage?: string;
    call?: string;
    status?: ApplicationStatus;
}




