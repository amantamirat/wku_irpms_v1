import mongoose from "mongoose";
import { Phase, IPhase, PhaseStatus } from "./phase.model";
import {
    CreatePhaseDto,
    GetPhasesOptions,
    UpdatePhaseDto,
} from "./phase.dto";

export interface IPhaseRepository {
    findById(id: string): Promise<IPhase | null>;
    find(filters: GetPhasesOptions): Promise<IPhase[]>;

    findOne(projectId: string, order: number): Promise<IPhase | null>;
    findFirstPhase(projectId: string): Promise<IPhase | null>;
    findLastPhase(projectId: string): Promise<IPhase | null>;
    findNextPhase(projectId: string, currentOrder: number): Promise<IPhase | null>;
    findPreviousPhase(projectId: string, currentOrder: number): Promise<IPhase | null>;

    create(dto: CreatePhaseDto): Promise<IPhase>;
    createMany(dtos: CreatePhaseDto[]): Promise<IPhase[]>;

    update(
        id: string,
        data: UpdatePhaseDto["data"]
    ): Promise<IPhase | null>;

    updateStatus(
        id: string,
        newStatus: PhaseStatus
    ): Promise<IPhase | null>;

    countByProject(projectId: string): Promise<number>;

    updateMany(filter: any, update: any): Promise<any>;

    delete(id: string): Promise<IPhase | null>;
    deleteByProject(projectId: string): Promise<any>;
}

export class PhaseRepository implements IPhaseRepository {

    async findById(id: string): Promise<IPhase | null> {
        return Phase.findById(new mongoose.Types.ObjectId(id))
            .lean<IPhase>()
            .exec();
    }

    async find(filters: GetPhasesOptions): Promise<IPhase[]> {
        const query: Record<string, unknown> = {};

        if (filters.project) {
            query.project = new mongoose.Types.ObjectId(filters.project);
        }

        let phaseQuery = Phase.find(query)
            .sort({ order: 1 });

        if (filters.populate) {
            phaseQuery = phaseQuery.populate({
                path: "project",
            });
        }

        return phaseQuery
            .lean<IPhase[]>()
            .exec();
    }

    async findOne(
        projectId: string,
        order: number
    ): Promise<IPhase | null> {
        return Phase.findOne({
            project: new mongoose.Types.ObjectId(projectId),
            order,
        })
            .lean<IPhase>()
            .exec();
    }

    /**
     * Returns the first phase of a project.
     * First = lowest order.
     */
    async findFirstPhase(
        projectId: string
    ): Promise<IPhase | null> {
        return Phase.findOne({
            project: new mongoose.Types.ObjectId(projectId),
        })
            .sort({ order: 1 })
            .lean<IPhase>()
            .exec();
    }

    /**
     * Returns the last phase of a project.
     * Last = highest order.
     */
    async findLastPhase(
        projectId: string
    ): Promise<IPhase | null> {
        return Phase.findOne({
            project: new mongoose.Types.ObjectId(projectId),
        })
            .sort({ order: -1 })
            .lean<IPhase>()
            .exec();
    }

    /**
     * Returns the phase immediately after the given order.
     */
    async findNextPhase(
        projectId: string,
        currentOrder: number
    ): Promise<IPhase | null> {
        return Phase.findOne({
            project: new mongoose.Types.ObjectId(projectId),
            order: { $gt: currentOrder },
        })
            .sort({ order: 1 })
            .lean<IPhase>()
            .exec();
    }

    /**
 * Returns the phase immediately before the given order.
 */
    async findPreviousPhase(
        projectId: string,
        currentOrder: number
    ): Promise<IPhase | null> {
        return Phase.findOne({
            project: new mongoose.Types.ObjectId(projectId),
            order: { $lt: currentOrder },
        })
            .sort({ order: -1 })
            .lean<IPhase>()
            .exec();
    }

    async create(dto: CreatePhaseDto): Promise<IPhase> {
        const data = {
            ...dto,
            project: new mongoose.Types.ObjectId(dto.project),
        };

        const created = await Phase.create(data);

        return created;
    }

    async createMany(
        dtos: CreatePhaseDto[]
    ): Promise<IPhase[]> {
        const data = dtos.map(dto => ({
            ...dto,
            project: new mongoose.Types.ObjectId(dto.project),
        }));

        const results = await Phase.insertMany(data, {
            ordered: true,
        });

        return results as unknown as IPhase[];
    }

    async update(
        id: string,
        dtoData: UpdatePhaseDto["data"]
    ): Promise<IPhase | null> {
        return Phase.findByIdAndUpdate(
            new mongoose.Types.ObjectId(id),
            { $set: dtoData },
            {
                new: true,
                runValidators: true,
            }
        ).exec();
    }

    async updateStatus(
        id: string,
        newStatus: PhaseStatus
    ): Promise<IPhase | null> {
        return Phase.findByIdAndUpdate(
            new mongoose.Types.ObjectId(id),
            { $set: { status: newStatus } },
            { new: true }
        ).exec();
    }

    async updateMany(
        filter: any,
        update: any
    ): Promise<any> {
        return Phase.updateMany(filter, update).exec();
    }

    async countByProject(
        projectId: string
    ): Promise<number> {
        return Phase.countDocuments({
            project: new mongoose.Types.ObjectId(projectId),
        }).exec();
    }

    async delete(id: string): Promise<IPhase | null> {
        return Phase.findByIdAndDelete(
            new mongoose.Types.ObjectId(id)
        ).exec();
    }

    async deleteByProject(projectId: string): Promise<any> {
        return Phase.deleteMany({
            project: new mongoose.Types.ObjectId(projectId),
        }).exec();
    }
}