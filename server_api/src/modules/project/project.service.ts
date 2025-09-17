import mongoose from "mongoose";
import { Project } from "./project.model";
import { CallService } from "../call/call.service";
import { CallStatus } from "../call/enums/call.status.enum";
import { ProjectStatus } from "./enums/project.status.enum";
import { CollaboratorService } from "./collaborators/collaborator.service";
import { ApplicantService } from "../applicants/applicant.service";
import { CollaboratorStatus } from "./enums/collaborator.status.enum";

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
        const applicant = await ApplicantService.findApplicant({ uid: data.createdBy }) as any;
        if (!applicant) {
            throw new Error("Default Applicant Data Not Found.");
        }
        const createdProject = await Project.create({ ...data, status: ProjectStatus.pending });
        await CollaboratorService.createCollaborator({ applicant: applicant._id, project: createdProject._id, isLeadPI: true, status: CollaboratorStatus.active });
        return createdProject;
    }

    static async getProjects() {
        return await Project.find().populate('call').lean();
    }

    static async getProjectById(id: mongoose.Types.ObjectId) {
        return await Project.findById(id).lean();
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
        const collaborator = await CollaboratorService.findCollaborator({ project: id });
        if (collaborator) {
            throw new Error(`Cannot delete: ${project.title} collaborator exist.`);
        }
        return await project.deleteOne();
    }
}
