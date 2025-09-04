import { Types } from "mongoose";
import { Project } from "./project.model";

export interface CreateProjectDto {
    call?: Types.ObjectId | string;
    title: string;
    summary?: string;
}

export class ProjectService {

    static async createProject(data: CreateProjectDto) {
        const createdProject = await Project.create({ ...data });
        return createdProject;
    }

    static async getProjects() {
        return Project.find().lean();
    }

    static async updateProject(id: string, data: Partial<CreateProjectDto>) {
        const project = await Project.findById(id);
        if (!project) throw new Error("Project not found");
        Object.assign(project, data);
        return project.save();
    }

    static async deleteProject(id: string) {
        const project = await Project.findById(id);
        if (!project) throw new Error("Project not found");
        return await project.deleteOne();
    }
}
