import mongoose from "mongoose";
import { Collaborator } from "./collaborator.model";
import { ProjectService } from "../project.service";
import { ProjectStatus } from "../enums/project.status.enum";
import { CollaboratorStatus } from "../enums/collaborator.status.enum";

export interface GetCollaboratorsOptions {
    project?: string;
}

export interface CreateCollaboratorDto {
    project: mongoose.Types.ObjectId;
    applicant: mongoose.Types.ObjectId;
    isLeadPI?: boolean;
}

export class CollaboratorService {

    private static async validateCollaborator(collaborator: CreateCollaboratorDto) {
        const project = await ProjectService.getProjectById(collaborator.project);
        if (!project) throw new Error("Project not found");
        if (project.status !== ProjectStatus.pending) throw new Error("Project is not pending.");
    }

    static async createCollaborator(data: CreateCollaboratorDto) {
        await this.validateCollaborator(data);
        const createdCollaborator = await Collaborator.create({ ...data, status: CollaboratorStatus.pending });
        return createdCollaborator;
    }

    static async getCollaborators(options: GetCollaboratorsOptions) {
        const filter: any = {};
        if (options.project) filter.project = options.project;
        return await Collaborator.find(filter).lean();
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
        return await collaborator.deleteOne();
    }
}
