import mongoose from "mongoose";
import { CallStatus } from "../call/call.enum";
import { Call } from "../call/call.model";
import { CollaboratorService, CreateCollaboratorDto } from "./collaborators/collaborator.service";
import { CreatePhaseDto } from "./phase/phase.service";
import { ProjectStatus } from "./project.enum";
import { Project } from "./project.model";
import { CreateProjectThemeDto } from "./themes/project.theme.service";
import Applicant from "../applicants/applicant.model";
import { Collaborator } from "./collaborators/collaborator.model";

export interface CreateProjectDto {
    call: mongoose.Types.ObjectId;
    title: string;
    summary?: string;
    createdBy: mongoose.Types.ObjectId;
    collaborators?: CreateCollaboratorDto[];
    phases?: CreatePhaseDto[];
    themes?: CreateProjectThemeDto[];
}

export class ProjectService {

    private static async validateProject(project: CreateProjectDto) {
        const call = await Call.findById(project.call).lean();
        if (!call) throw new Error("Call not found");
        if (call.status !== CallStatus.active) throw new Error("Call is not active.");
        const now = new Date();
        if (call.deadline < now) {
            throw new Error("The deadline for this call has already passed");
        }
    }

    static async createProject(data: CreateProjectDto) {
        await this.validateProject(data);
        //is it mandatory....?
        //const applicant = await ApplicantService.findApplicant({ uid: data.createdBy }) as any;
        //if (!applicant) {
        //throw new Error("Default Applicant Data Not Found.");
        //}
        const createdProject = await Project.create({ ...data, status: ProjectStatus.pending });
        //await CollaboratorService.createCollaborator({ applicant: applicant._id, project: createdProject._id, isLeadPI: true, status: CollaboratorStatus.active });
        return createdProject;
    }

    static async submitProject(dto: CreateProjectDto) {
        await this.validateProject(dto);
        let hasLeadPI = false;
        for (const collab of dto.collaborators ?? []) {
            const applicant = await Applicant.findById(collab.applicant).lean();
            if (!applicant) {
                throw new Error(`Applicant not found: ${collab.applicant}`);
            }
            if (collab.isLeadPI) {
                if (hasLeadPI) {
                    throw new Error("A project can have only one Lead PI");
                }
                hasLeadPI = true;
            }
        }
        const submittedProject = await Project.create({ ...dto, status: ProjectStatus.pending });

        return submittedProject;
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
        const collaborator = await Collaborator.exists({ project: project._id });
        if (collaborator) {
            throw new Error(`Cannot delete: ${project.title} collaborator exist.`);
        }
        return await project.deleteOne();
    }
}
