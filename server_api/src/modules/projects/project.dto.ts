import { ProjectStatus } from "./project.state-machine";

export interface GetProjectsDTO {
    grant?: string;
    applicant?: string;
    status?: ProjectStatus;
    populate?: boolean;
    workspace?: string;
    directorate?: string;
    //skip?: number;
    //limit?: number;
}

// CREATE Project
export interface CreateProjectDTO {
    grant: string;
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
        //applicant: string;
        themes: string[];
        status: ProjectStatus;
    }>;
    applicantId: string;
}

export interface ExistsProjectDTO {
    applicant?: string;
    grant?: string;
}

