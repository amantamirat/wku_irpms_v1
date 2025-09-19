import mongoose from "mongoose";
import { Collaborator } from "./collaborator.model";
import { ProjectService } from "../project.service";
import { ProjectStatus } from "../enums/project.status.enum";
import { CollaboratorStatus } from "../enums/collaborator.status.enum";

export interface GetCollaboratorOptions {
    _id?: string;
    project?: string;
    applicant?: string;
}

export interface CreateCollaboratorDto {
    project: mongoose.Types.ObjectId;
    applicant: mongoose.Types.ObjectId;
    isLeadPI?: boolean;
    status?: CollaboratorStatus;
}

export interface UpdateCollaboratorDto {
    isLeadPI?: boolean;
    status?: CollaboratorStatus;
}

export class CollaboratorService {

    private static async validateCollaborator(collaborator: CreateCollaboratorDto) {
        const project = await ProjectService.getProjectById(collaborator.project);
        if (!project) throw new Error("Project not found");
        if (project.status !== ProjectStatus.pending) throw new Error("Project is not pending.");
    }

    static async createCollaborator(data: CreateCollaboratorDto) {
        await this.validateCollaborator(data);
        const createdCollaborator = await Collaborator.create({ ...data, status: data.status ?? CollaboratorStatus.pending });
        return createdCollaborator;
    }

    static async getCollaborators(options: GetCollaboratorOptions) {
        const filter: any = {};
        if (options.project) filter.project = options.project;
        const collaborators = await Collaborator.find(filter).populate("applicant").lean();
        //console.log(collaborators, filter);
        return collaborators;
    }

    static async findCollaborator(options: GetCollaboratorOptions) {
        const filter: any = {};
        if (options.project) filter.project = options.project;
        if (options.applicant) filter.applicant = options.applicant;
        if (options._id) filter._id = options._id;
        return await Collaborator.findOne(filter).lean();
    }

    static async updateCollaborator(id: string, data: Partial<UpdateCollaboratorDto>) {
        const collaborator = await Collaborator.findById(id);
        if (!collaborator) throw new Error("Collaborator not found");
        Object.assign(collaborator, data);
        return collaborator.save();
    }

    static async deleteCollaborator(id: string) {
        const collaborator = await Collaborator.findById(id);
        if (!collaborator) throw new Error("Collaborator not found");
        if (collaborator.status !== CollaboratorStatus.pending) {
            throw new Error("Can Not Delete Non Pending Collaborator");
        }
        return await collaborator.deleteOne();
    }
}
