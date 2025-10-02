import mongoose from "mongoose";
import { Project } from "./project.model";
import { CallStatus } from "../call/call.enum";
import { ProjectStatus } from "./project.enum";
import { CollaboratorService, CreateCollaboratorDto } from "./collaborators/collaborator.service";
import { ApplicantService } from "../applicants/applicant.service";
import { CollaboratorStatus } from "./collaborators/collaborator.enum";
import { Call } from "../call/call.model";
import { CreatePhaseDto } from "./phase/phase.service";
import { CreateProjectThemeDto } from "./themes/project.theme.service";

export interface CreateProjectDto {
    call: mongoose.Types.ObjectId;
    title: string;
    summary?: string;
    createdBy: mongoose.Types.ObjectId;
    collaborators: CreateCollaboratorDto[];
    phases?: CreatePhaseDto[];
    themes?: CreateProjectThemeDto[];
}

export class ProjectService {

    private static async validateProject(project: CreateProjectDto) {
        const call = await Call.findById(project.call);
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
