import mongoose from "mongoose";
import { ProjectStatus } from "./project.enum";

// Base fields for creating any project
export interface CreateProjectDto {
    cycle: mongoose.Types.ObjectId;
    title: string;
    summary?: string;
    status?: ProjectStatus;
    userId: string; // actor performing the create
}

// Base fields for updating any project
export interface UpdateProjectDto {
    id: string | mongoose.Types.ObjectId;
    data: Partial<{
        title: string;
        summary: string;
        status: ProjectStatus;
    }>;
    userId: string;
}

// Options for querying projects
export interface GetProjectsOptions {
    userId?: string;
    cycle?: mongoose.Types.ObjectId;
    status?: ProjectStatus;
}

// Delete DTO
export interface DeleteProjectDto {
    id: string | mongoose.Types.ObjectId;
    userId: string;
}
