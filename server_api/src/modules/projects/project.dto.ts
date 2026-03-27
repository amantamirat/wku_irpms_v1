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
}

// UPDATE Project
export interface UpdateProjectDTO {
    id: string;
    data: Partial<{
        title: string;
        summary: string;
        //applicant: string;
        totalBudget: number;
        totalDuration: number;
        totalCollabs: number;
        status: ProjectStatus;
    }>;
    applicantId: string;
}

export interface UpdateStatusDTO {
    data: {
        id: string;
        status: ProjectStatus;
    };
}

export interface ExistsProjectDTO {
    applicant?: string;
    grant?: string;
}

