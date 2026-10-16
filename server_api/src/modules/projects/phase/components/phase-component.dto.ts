import mongoose from "mongoose";

export interface ProjectComponentDto {
    title: string;
    description?: string;
    contributors: string[];
}

export interface CreateProjectComponentDto extends ProjectComponentDto {
    project: string;
}

export interface FilterProjectComponents {
    project?: string | mongoose.Types.ObjectId;
    phase?: string | mongoose.Types.ObjectId;
}

export interface UpdateProjectComponentDto {
    title?: string;
    description?: string;
    contributors?: string[];
}
