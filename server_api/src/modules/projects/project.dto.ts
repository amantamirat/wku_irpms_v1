import { ProjectStatus } from "./project.enum";

// GET / Query Projects
export interface GetProjectsDTO {
    userId?: string;
    cycleId?: string;
    status?: ProjectStatus;
    skip?: number;
    limit?: number;
}

// CREATE Project
export interface CreateProjectDTO {
    cycleId: string;
    title: string;
    summary?: string;
    status?: ProjectStatus;
    leadPIId?: string;  // the lead PI (if it's different from user)
    userId: string;    // who is creating
}

// UPDATE Project
export interface UpdateProjectDTO {
    id: string;
    data: Partial<{
        title: string;
        summary: string;
        status: ProjectStatus;
        leadPIId: string;
    }>;
    userId: string;  // who is making the update
}

// DELETE Project
export interface DeleteProjectDTO {
    id: string;
    userId: string;
}

export interface Phase {
    activity: string;
    duration: number;
    budget: number;
    description?: string;
}

export interface SubmitProjectDTO {
    cycle: string;
    title: string;
    summary?: string;
    leadPI: string;
    collaborators?: string[];
    phases?: Phase[];
    themes?: string[];
    documentPath?: string;
}