import mongoose from "mongoose";
import Applicant from "../../applicants/applicant.model";
import { ProjectStatus } from "../project.enum";
import { Project } from "../project.model";
import { CollaboratorStatus } from "./collaborator.enum";
import { Collaborator } from "./collaborator.model";

export interface GetCollaboratorOptions {
    _id?: string;
    project?: mongoose.Types.ObjectId;
    applicant?: mongoose.Types.ObjectId;
}

export interface CreateCollaboratorDto {
    project?: mongoose.Types.ObjectId;
    applicant: mongoose.Types.ObjectId;
    isLeadPI?: boolean;
    status?: CollaboratorStatus;
}


export class CollaboratorService {

    private static async validateCollaborator(collaborator: CreateCollaboratorDto) {
        const project = await Project.findById(collaborator.project).lean();
        //const project = await Project.findOne({ project: collaborator.project, status: { $ne: ProjectStatus.pending } }).lean();        
        if (!project) throw new Error("Project not found");
        const applicant = await Applicant.findById(collaborator.applicant).lean();
        if (!applicant) throw new Error("Applicant not found");
    }

    static async createCollaborator(data: CreateCollaboratorDto) {
        await this.validateCollaborator(data);
        const createdCollaborator = await Collaborator.create({ ...data, status: data.status ?? CollaboratorStatus.pending });
        return createdCollaborator;
    }

    static async getCollaborators(options: GetCollaboratorOptions) {
        const filter: any = {};
        if (options.project) {
            filter.project = options.project;
            const collaborators = await Collaborator.find(filter).populate("applicant").lean();
            return collaborators;
        }
        if (options.applicant) {
            filter.applicant = options.applicant;
            const collaborators = await Collaborator.find(filter).populate("project").lean();
            return collaborators;
        }
    }

    static async updateCollaborator(id: string, data: Partial<CreateCollaboratorDto>) {
        const collaborator = await Collaborator.findById(id);
        if (!collaborator) throw new Error("Collaborator not found");
        Object.assign(collaborator, data);
        return collaborator.save();
    }

    static async deleteCollaborator(id: string) {
        const collaborator = await Collaborator.findById(id);
        if (!collaborator) throw new Error("Collaborator not found");
        if (collaborator.status === CollaboratorStatus.active) {
            throw new Error("Can Not Delete Active Collaborator");
        }
        return await collaborator.deleteOne();
    }
}
