// collaborator.repository.ts
import mongoose from "mongoose";
import { Collaborator, ICollaborator } from "./collaborator.model";
import {
    CreateCollaboratorDto,
    GetCollaboratorsOptions,
    UpdateCollaboratorDto,
} from "./collaborator.dto";
import { CollaboratorStatus } from "./collaborator.enum";

export interface ICollaboratorRepository {
    findById(id: string): Promise<ICollaborator | null>;
    find(filters: GetCollaboratorsOptions): Promise<ICollaborator[]>;
    create(dto: CreateCollaboratorDto): Promise<ICollaborator>;
    update(id: string, data: UpdateCollaboratorDto["data"]): Promise<ICollaborator>;
    delete(id: string): Promise<ICollaborator | null>;
    //checkProjectAndApplicantExist(projectId: string, applicantId: string): Promise<{ projectExists: boolean; applicantExists: boolean }>;
    //verifyUserCanDelete(collaboratorId: string, userId: string): Promise<boolean>;
}

// MongoDB implementation
export class CollaboratorRepository implements ICollaboratorRepository {

    async findById(id: string) {
        return Collaborator.findById(new mongoose.Types.ObjectId(id))
            /*    
            .populate([
                    { path: 'applicant', populate: { path: 'organization' } },
                    { path: 'project' }
                ])*/
            .lean<ICollaborator>()
            .exec();
    }

    async find(filters: GetCollaboratorsOptions) {
        const query: any = {};

        if (filters.project) {
            query.project = new mongoose.Types.ObjectId(filters.project);
        }

        if (filters.applicant) {
            query.applicant = new mongoose.Types.ObjectId(filters.applicant);
        }

        return Collaborator.find(query)
            .populate([
                { path: 'applicant', populate: { path: 'organization' } },
                { path: 'project' }
            ])
            .lean<ICollaborator[]>()
            .exec();
    }

    async create(dto: CreateCollaboratorDto) {
        const data: Partial<ICollaborator> = {
            project: new mongoose.Types.ObjectId(dto.project),
            applicant: new mongoose.Types.ObjectId(dto.applicant),
            isLeadPI: dto.isLeadPI,
            status: CollaboratorStatus.pending
        };

        return Collaborator.create(data);
    }

    async update(id: string, dtoData: UpdateCollaboratorDto["data"]): Promise<ICollaborator> {
        const updateData: Partial<ICollaborator> = {};

        if (dtoData.isLeadPI !== undefined) updateData.isLeadPI = dtoData.isLeadPI;
        if (dtoData.status !== undefined) updateData.status = dtoData.status;

        const updated = await Collaborator.findByIdAndUpdate(
            new mongoose.Types.ObjectId(id),
            { $set: updateData },
            { new: true, runValidators: true }
        )
            /*    
            .populate([
                    { path: 'applicant', populate: { path: 'organization' } },
                    { path: 'project' }
                ])*/
            .exec();

        if (!updated) throw new Error("Collaborator not found");
        return updated;
    }

    async delete(id: string) {
        return await Collaborator.findByIdAndDelete(new mongoose.Types.ObjectId(id))
             /*    
            .populate([
                    { path: 'applicant', populate: { path: 'organization' } },
                    { path: 'project' }
                ])*/
            .exec();
    }

    /**
     * 
     * async checkProjectAndApplicantExist(projectId: string, applicantId: string) {
        const [project, applicant] = await Promise.all([
            mongoose.model("Project").findById(new mongoose.Types.ObjectId(projectId)).lean().exec(),
            mongoose.model("Applicant").findById(new mongoose.Types.ObjectId(applicantId)).lean().exec()
        ]);

        return {
            projectExists: !!project,
            applicantExists: !!applicant
        };
    }

    async verifyUserCanDelete(collaboratorId: string, userId: string): Promise<boolean> {
        const collaborator = await Collaborator.findById(new mongoose.Types.ObjectId(collaboratorId))
            .populate('project')
            .lean()
            .exec();

        if (!collaborator) return false;

        const project = collaborator.project as any;
        if (!project || !project.createdBy) return false;

        // Check if user is the project creator and collaborator is not active
        const isProjectCreator = project.createdBy.toString() === userId;
        const isNotActive = collaborator.status !== CollaboratorStatus.active;

        return isProjectCreator && isNotActive;
    }
     */


}