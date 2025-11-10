import Applicant from "../../applicants/applicant.model";
import { Project } from "../project.model";
import {
    CreateCollaboratorDto,
    DeleteCollaboratorDto,
    GetCollaboratorsOptions,
    UpdateCollaboratorDto,
} from "./collaborator.dto";
import { CollaboratorStatus } from "./collaborator.enum";
import { Collaborator } from "./collaborator.model";


export class CollaboratorService {

    static async createCollaborator(dto: CreateCollaboratorDto) {
        const project = await Project.findById(dto.project).lean();
        if (!project) throw new Error("Project not found");
        const applicant = await Applicant.findById(dto.applicant).lean();
        if (!applicant) throw new Error("Applicant not found");
        const createdCollaborator = await Collaborator.create({ ...dto });
        return createdCollaborator;
    }

    static async getCollaborators(options: GetCollaboratorsOptions) {
        const filter: any = {};
        if (options.project) {
            filter.project = options.project;
        }
        if (options.applicant) {
            filter.applicant = options.applicant;
        }
        const collaborators = await Collaborator.find(filter).populate([
            { path: 'applicant' },
            { path: 'project' }
        ]).lean();
        return collaborators;
    }

    static async updateCollaborator(dto: UpdateCollaboratorDto) {
        const { id, data, userId } = dto;
        const collaborator = await Collaborator.findById(id);
        if (!collaborator) throw new Error("Collaborator not found");
        Object.assign(collaborator, data);
        return collaborator.save();
    }

    static async deleteCollaborator(dto: DeleteCollaboratorDto) {
        const { id, userId } = dto;
        const collaborator = await Collaborator.findById(id);
        if (!collaborator) throw new Error("Collaborator not found");
        const project = await Project.findById(collaborator.project).lean();
        if (!project) throw new Error("Project not found");
        const createdBy = project.createdBy ? project.createdBy.toString() : undefined;
        if (!createdBy || createdBy !== userId) throw new Error("User not authorized to delete collaborator");
        if (collaborator.status === CollaboratorStatus.active) {
            throw new Error("Can Not Delete Active Collaborator");
        }
        return await collaborator.deleteOne();
    }
}
