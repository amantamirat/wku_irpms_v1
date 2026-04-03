import { ProjectStatus } from "./project.state-machine";

export interface GetProjectsDTO {
    grantAllocation?: string;
    applicant?: string;
    calendar?: string;
    grant?: string;
    workspace?: string;
    status?: ProjectStatus;
    populate?: boolean;
    //directorate?: string;
    //skip?: number;
    //limit?: number;
}

// CREATE Project
export interface CreateProjectDTO {
    grantAllocation: string;
    title: string;
    summary?: string;
    applicant: string;
    themes: string[];
}

// UPDATE Project
export interface UpdateProjectDTO {
    id: string;
    data: Partial<{
        title: string;
        summary: string;        
        totalBudget: number;
        totalDuration: number;
        totalCollabs: number;
        themes: string[];
    }>;
    applicantId: string;
}

export interface ExistsProjectDTO {
    applicant?: string;
    grantAllocation?: string;
}

