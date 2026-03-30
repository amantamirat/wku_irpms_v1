// collaborator.repository.ts
import mongoose from "mongoose";
import { Collaborator, ICollaborator } from "./collaborator.model";
import {
    CreateCollaboratorDto,
    ExistsCollabDTO,
    GetCollaboratorsOptions,
    UpdateCollaboratorDto,
} from "./collaborator.dto";
import { CollaboratorStatus } from "./collaborator.status";

export interface ICollaboratorRepository {
    findById(id: string): Promise<ICollaborator | null>;
    find(filters: GetCollaboratorsOptions): Promise<ICollaborator[]>;
    create(dto: CreateCollaboratorDto): Promise<ICollaborator>;
    createMany(dtos: CreateCollaboratorDto[]): Promise<ICollaborator[]>;
    update(id: string, data: UpdateCollaboratorDto["data"]): Promise<ICollaborator | null>;
    exists(filters: ExistsCollabDTO): Promise<boolean>;
    delete(id: string): Promise<ICollaborator | null>;
    deleteByProject(projectId: string): Promise<any>;
}

// MongoDB implementation
export class CollaboratorRepository implements ICollaboratorRepository {

    async findById(id: string) {
        return Collaborator.findById(new mongoose.Types.ObjectId(id))
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

        let dbQuery = Collaborator.find(query);

        if (filters.populate) {
            dbQuery = dbQuery.populate([
                { path: 'applicant', populate: { path: 'workspace' } },
                { path: 'project' }
            ]);
        }

        return dbQuery
            .lean<ICollaborator[]>()
            .exec();
    }


    async create(dto: CreateCollaboratorDto) {
        const data: Partial<ICollaborator> = {
            project: new mongoose.Types.ObjectId(dto.project),
            applicant: new mongoose.Types.ObjectId(dto.applicant),
            isLeadPI: dto.isLeadPI,
            status: dto.status
            //  status: CollaboratorStatus.pending
        };

        return Collaborator.create(data);
    }

    // ✅ NEW: bulk insert
    async createMany(dtos: CreateCollaboratorDto[]) {
        const data: Partial<ICollaborator>[] = dtos.map(dto => ({
            project: new mongoose.Types.ObjectId(dto.project),
            applicant: new mongoose.Types.ObjectId(dto.applicant),
        }));
        return Collaborator.insertMany(data, { ordered: true });
    }

    async update(id: string, dtoData: UpdateCollaboratorDto["data"]): Promise<ICollaborator | null> {
        const updateData: Partial<ICollaborator> = {};

        if (dtoData.isLeadPI !== undefined) updateData.isLeadPI = dtoData.isLeadPI;
        if (dtoData.status !== undefined) updateData.status = dtoData.status;

        return Collaborator.findByIdAndUpdate(
            new mongoose.Types.ObjectId(id),
            { $set: updateData },
            { new: true, runValidators: true }
        ).exec();

    }

    async exists(filters: ExistsCollabDTO): Promise<boolean> {
        const query: any = {};
        const { applicant } = filters;
        if (applicant) {
            query.applicant = new mongoose.Types.ObjectId(applicant);
        }
        const result = await Collaborator.exists(query).exec();
        return result !== null;
    }

    async delete(id: string) {
        return Collaborator.findByIdAndDelete(new mongoose.Types.ObjectId(id)).exec();
    }
    async deleteByProject(projectId: string) {
        if (!mongoose.Types.ObjectId.isValid(projectId)) throw new Error("Invalid Project ID");
        return Collaborator.deleteMany({
            project: new mongoose.Types.ObjectId(projectId)
        }).exec();
    }
}