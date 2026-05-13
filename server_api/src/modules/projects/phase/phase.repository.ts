import mongoose, { ClientSession } from "mongoose";
import { Phase, IPhase } from "./phase.model";
import {
    CreatePhaseDto,
    GetPhasesOptions,
    UpdatePhaseDto,
} from "./phase.dto";
import { PhaseStatus } from "./phase.model";

export interface IPhaseRepository {
    findById(id: string): Promise<IPhase | null>;
    find(filters: GetPhasesOptions, session?: ClientSession): Promise<IPhase[]>;
    findOne(projectId: string, order: number, session?: ClientSession): Promise<IPhase | null>;
    create(dto: CreatePhaseDto, session?: ClientSession): Promise<IPhase>;
    createMany(dtos: CreatePhaseDto[], session?: ClientSession): Promise<IPhase[]>;
    update(id: string, data: UpdatePhaseDto["data"]): Promise<IPhase | null>;
    updateStatus(id: string, newStatus: PhaseStatus): Promise<IPhase | null>;
    countByProject(projectId: string, session?: ClientSession): Promise<number>;
    updateMany(filter: any, update: any): Promise<any>;
    delete(id: string): Promise<IPhase | null>;
    deleteByProject(projectId: string): Promise<any>;
}

export class PhaseRepository implements IPhaseRepository {

    async findById(id: string) {
        return Phase.findById(new mongoose.Types.ObjectId(id))
            .lean<IPhase>()
            .exec();
    }

    async find(
        filters: GetPhasesOptions,
        session?: ClientSession
    ): Promise<IPhase[]> {
        const query: Record<string, unknown> = {};

        if (filters.project) {
            query.project = new mongoose.Types.ObjectId(filters.project);
        }

        let phaseQuery = Phase.find(query)
            .sort({ order: 1 }) // Always sort by order
            .session(session ?? null); // 👈 attach session safely

        if (filters.populate) {
            phaseQuery = phaseQuery.populate({ path: 'project' });
        }

        return phaseQuery
            .lean<IPhase[]>()
            .exec();
    }


    async findOne(projectId: string, order: number, session?: ClientSession) {
        const query = Phase.findOne({ project: new mongoose.Types.ObjectId(projectId), order });
        if (session) {
            query.session(session);
        }
        return query
            .lean<IPhase>()
            .exec();
    }

    async create(dto: CreatePhaseDto, session?: ClientSession) {
        const data = {
            ...dto,
            project: new mongoose.Types.ObjectId(dto.project),
        };
        const created = await Phase.create([data], { session });
        return created[0];
    }

    async createMany(dtos: CreatePhaseDto[], session?: ClientSession) {
        const data = dtos.map(dto => ({
            ...dto,
            project: new mongoose.Types.ObjectId(dto.project),
        }));

        const results = await Phase.insertMany(data, {
            ordered: true,
            session
        });

        return results as unknown as IPhase[];
    }

    async update(id: string, dtoData: UpdatePhaseDto["data"]): Promise<IPhase | null> {
        // We use $set with the spread dtoData to handle breakdown, budget, etc.
        return Phase.findByIdAndUpdate(
            new mongoose.Types.ObjectId(id),
            { $set: dtoData },
            { new: true, runValidators: true }
        ).exec();
    }

    async updateStatus(id: string, newStatus: PhaseStatus) {
        return Phase.findByIdAndUpdate(
            new mongoose.Types.ObjectId(id),
            { $set: { status: newStatus } },
            { new: true }
        ).exec();
    }

    async updateMany(filter: any, update: any) {
        return Phase.updateMany(filter, update).exec();
    }

    async countByProject(projectId: string, session?: ClientSession) {
        let query = Phase.countDocuments({
            project: new mongoose.Types.ObjectId(projectId)
        });

        if (session) {
            query = query.session(session);
        }
        return query.exec();
    }

    async delete(id: string) {
        return await Phase.findByIdAndDelete(new mongoose.Types.ObjectId(id))
            .exec();
    }
    async deleteByProject(projectId: string) {
        //  if (!mongoose.Types.ObjectId.isValid(projectId)) throw new Error("Invalid Project ID");
        return Phase.deleteMany({
            project: new mongoose.Types.ObjectId(projectId)
        }).exec();
    }
}