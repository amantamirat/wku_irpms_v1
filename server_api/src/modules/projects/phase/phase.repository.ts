// phase.repository.ts
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
}

// MongoDB implementation
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

        let phaseQuery = Phase.find(query);

        if (filters.populate) {
            phaseQuery = phaseQuery.populate({ path: 'project' });
        }

        return phaseQuery
            .lean<IPhase[]>()
            .exec();
    }


    async create(dto: CreatePhaseDto) {
        const data: Partial<IPhase> = {
            project: new mongoose.Types.ObjectId(dto.project),
            activity: dto.activity,
            duration: dto.duration,
            budget: dto.budget,
            description: dto.description
        };
        return Phase.create(data);
    }

    // ✅ NEW: bulk insert
    async createMany(dtos: CreatePhaseDto[]) {
        const data: Partial<IPhase>[] = dtos.map(dto => ({
            project: new mongoose.Types.ObjectId(dto.project),
            activity: dto.activity,
            duration: dto.duration,
            budget: dto.budget,
            description: dto.description,
            //type: dto.type
        }));

        return Phase.insertMany(data, { ordered: true });
    }

    async update(id: string, dtoData: UpdatePhaseDto["data"]): Promise<IPhase | null> {
        const updateData: Partial<IPhase> = {};

        if (dtoData.activity) {
            updateData.activity = dtoData.activity;
        }
        if (dtoData.duration) {
            updateData.duration = dtoData.duration;
        }
        if (dtoData.budget) {
            updateData.budget = dtoData.budget;
        }
        if (dtoData.description) {
            updateData.description = dtoData.description;
        }
        if (dtoData.status) {
            updateData.status = dtoData.status;
        }
        return Phase.findByIdAndUpdate(
            new mongoose.Types.ObjectId(id),
            { $set: updateData },
            { new: true, runValidators: true }
        )
            .exec();
    }

    async delete(id: string) {
        return await Phase.findByIdAndDelete(new mongoose.Types.ObjectId(id))
            .exec();
    }
}