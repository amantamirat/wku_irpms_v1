// collaborator.repository.ts
import { Collaborator, ICollaborator } from "./collaborator.model";
import {
    CreateCollaboratorDto,
    FilterCollaborators,
    UpdateCollaboratorDto,
} from "./collaborator.dto";
import { CollaboratorStatus } from "./collaborator.model";
import { FilterOptions } from "../../../common/dtos/filter.dto";
import mongoose from "mongoose";

export interface ICollaboratorRepository {
    findById(id: string): Promise<ICollaborator | null>;
    find(filters: FilterCollaborators, option?: FilterOptions): Promise<ICollaborator[]>;
    create(dto: CreateCollaboratorDto): Promise<ICollaborator>;
    createMany(dtos: CreateCollaboratorDto[]): Promise<ICollaborator[]>;
    update(id: string, data: UpdateCollaboratorDto["data"]): Promise<ICollaborator | null>;
    updateStatus(id: string, newStatus: CollaboratorStatus): Promise<ICollaborator | null>;
    exists(filters: FilterCollaborators): Promise<boolean>;
    existsUnverified(project: string): Promise<boolean>;
    countByProject(project: string): Promise<number>;
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

    async find(filters: FilterCollaborators, options?: FilterOptions) {
        const query: any = {};

        if (filters.project) {
            query.project = new mongoose.Types.ObjectId(filters.project);
        }

        if (filters.member) {
            query.member = new mongoose.Types.ObjectId(filters.member);
        }

        if (filters.status) {
            query.status = filters.status;
        }

        let dbQuery = Collaborator.find(query);

        if (options?.populate) {
            dbQuery = dbQuery.populate([
                { path: 'member', populate: { path: 'workspace' } },
                { path: 'project', populate: { path: 'leadPI' } }
            ]);
        }

        return dbQuery
            .lean<ICollaborator[]>()
            .exec();
    }


    async create(dto: CreateCollaboratorDto) {
        const data: Partial<ICollaborator> = {
            ...dto,
            project: new mongoose.Types.ObjectId(dto.project),
            member: new mongoose.Types.ObjectId(dto.member),
        };

        return Collaborator.create(data);
    }

    // ✅ NEW: bulk insert
    async createMany(dtos: CreateCollaboratorDto[]) {
        const data: Partial<ICollaborator>[] = dtos.map(dto => ({
            project: new mongoose.Types.ObjectId(dto.project),
            member: new mongoose.Types.ObjectId(dto.member),
        }));
        return Collaborator.insertMany(data, { ordered: true });
    }

    async update(id: string, dtoData: UpdateCollaboratorDto["data"]): Promise<ICollaborator | null> {
        const updateData: Partial<ICollaborator> = {};

        if (dtoData.isLeadPI !== undefined) updateData.isLeadPI = dtoData.isLeadPI;
        if (dtoData.role !== undefined) updateData.role = dtoData.role;

        return Collaborator.findByIdAndUpdate(
            new mongoose.Types.ObjectId(id),
            { $set: updateData },
            { new: true, runValidators: true }
        ).exec();

    }


    async updateStatus(id: string, newStatus: CollaboratorStatus) {
        return Collaborator.findByIdAndUpdate(
            new mongoose.Types.ObjectId(id),
            { $set: { status: newStatus } },
            { new: true }
        ).exec();
    }

    async exists(filters: FilterCollaborators): Promise<boolean> {
        const query: any = {};
        const { project, member, status } = filters;

        if (!project && !member && !status) {
            return false;
        }

        if (project) {
            query.project = new mongoose.Types.ObjectId(project);
        }
        if (member) {
            query.member = new mongoose.Types.ObjectId(member);
        }

        if (status) {
            query.status = status;
        }

        const result = await Collaborator.exists(query).exec();
        return result !== null;
    }

    async existsUnverified(project: string): Promise<boolean> {
        const result = await Collaborator.exists({
            project: new mongoose.Types.ObjectId(project),
            status: { $ne: CollaboratorStatus.verified }
        }).exec();

        return result !== null;
    }

    async countByProject(project: string): Promise<number> {
        return Collaborator.countDocuments({
            project: new mongoose.Types.ObjectId(project)
        }).exec();
    }

    async delete(id: string) {
        return Collaborator.findByIdAndDelete(new mongoose.Types.ObjectId(id)).exec();
    }
    async deleteByProject(project: string) {
        if (!mongoose.Types.ObjectId.isValid(project)) throw new Error("Invalid Project ID");
        return Collaborator.deleteMany({
            project: new mongoose.Types.ObjectId(project)
        }).exec();
    }
}