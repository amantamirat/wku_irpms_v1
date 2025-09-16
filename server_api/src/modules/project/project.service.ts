import mongoose from "mongoose";
import { Project } from "./project.model";
import { CallService } from "../call/call.service";
import { CallStatus } from "../call/enums/call.status.enum";

export interface CreateProjectDto {
    call: mongoose.Types.ObjectId;
    title: string;
    summary?: string;
    createdBy: mongoose.Types.ObjectId;
}

export class ProjectService {

    private static async validateProject(project: CreateProjectDto) {
        const call = await CallService.getCallById(project.call);
        if (!call) throw new Error("Call not found");
        if (call.status !== CallStatus.active) throw new Error("Call is not active.");
        const now = new Date();
        if (call.deadline < now) {
            throw new Error("The deadline for this call has already passed");
        }
    }

    static async createProject(data: CreateProjectDto) {
        await this.validateProject(data);
        const createdProject = await Project.create({ ...data });
        return createdProject;
    }

    static async getProjects() {
        return await Project.find().populate('call').lean();
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
