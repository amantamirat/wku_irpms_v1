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
    userId: string;    // who is creating
    //leadPIId?: string;  // the lead PI (if it's different from user)
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

