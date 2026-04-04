import mongoose from "mongoose";
import { Phase, IPhase } from "./phase.model";
import {
    CreatePhaseDto,
    GetPhasesOptions,
    UpdatePhaseDto,
} from "./phase.dto";

export interface IPhaseRepository {
    findById(id: string): Promise<IPhase | null>;
    find(filters: GetPhasesOptions): Promise<IPhase[]>;
    create(dto: CreatePhaseDto): Promise<IPhase>;
    createMany(dtos: CreatePhaseDto[]): Promise<IPhase[]>;
    update(id: string, data: UpdatePhaseDto["data"]): Promise<IPhase | null>;
    delete(id: string): Promise<IPhase | null>;
    deleteByProject(projectId: string): Promise<any>;
}

export class PhaseRepository implements IPhaseRepository {

    async findById(id: string) {
        return Phase.findById(new mongoose.Types.ObjectId(id))
            .lean<IPhase>()
            .exec();
    }

    async find(filters: GetPhasesOptions): Promise<IPhase[]> {
        const query: Record<string, unknown> = {};

        if (filters.project) {
            query.project = new mongoose.Types.ObjectId(filters.project);
        }

        let phaseQuery = Phase.find(query).sort({ order: 1 }); // Always sort by order

        if (filters.populate) {
            phaseQuery = phaseQuery.populate({ path: 'project' });
        }

        return phaseQuery
            .lean<IPhase[]>()
            .exec();
    }

    async create(dto: CreatePhaseDto) {
        const data = {
            ...dto,
            project: new mongoose.Types.ObjectId(dto.project),
        };
        return Phase.create(data);
    }

    async createMany(dtos: CreatePhaseDto[]) {
        const data = dtos.map(dto => ({
            ...dto,
            project: new mongoose.Types.ObjectId(dto.project),
        }));

        // cast as any to bypass strict internal hydration types if necessary, 
        // but insertMany works fine with the mapped array
        const results = await Phase.insertMany(data, { ordered: true });
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

    async delete(id: string) {
        return await Phase.findByIdAndDelete(new mongoose.Types.ObjectId(id))
            .exec();
    }
    async deleteByProject(projectId: string) {
        if (!mongoose.Types.ObjectId.isValid(projectId)) throw new Error("Invalid Project ID");
        return Phase.deleteMany({
            project: new mongoose.Types.ObjectId(projectId)
        }).exec();
    }
}