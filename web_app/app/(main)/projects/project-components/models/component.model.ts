import { User } from "../../../users/models/user.model";
import { Project } from "../../models/project.model";

export interface ProjectComponentDTO {
    _id?: string;
    project?: string | Project;
    title: string;
    description?: string;
    contributors?: string[] | User[];
    investigator: string | User;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface FilterProjectComponents {
    project?: string | Project;
    investigator?: string;
}