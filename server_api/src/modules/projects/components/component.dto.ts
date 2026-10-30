
import mongoose from "mongoose";

export type ObjectIdInput = string | mongoose.Types.ObjectId;

export interface ProjectComponentDTO {
    title: string;
    description?: string;
    contributors: ObjectIdInput[];
    investigator: ObjectIdInput;
}

export interface CreateProjectComponentDTO extends ProjectComponentDTO {
    project: ObjectIdInput;
}

export interface UpdateProjectComponentDTO {
    title?: string;
    description?: string;
    contributors?: ObjectIdInput[];
    investigator?: ObjectIdInput;
}

export interface FilterProjectComponents {
    project?: ObjectIdInput;
    title?: string;
    description?: string;
    contributors?: ObjectIdInput[];
    investigator?: ObjectIdInput;
}
