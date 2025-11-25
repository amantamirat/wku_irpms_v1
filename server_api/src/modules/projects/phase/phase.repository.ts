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
    update(id: string, data: UpdatePhaseDto["data"]): Promise<IPhase>;
    delete(id: string): Promise<IPhase | null>;
}

// MongoDB implementation
export class PhaseRepository implements IPhaseRepository {

    async findById(id: string) {
        return Phase.findById(new mongoose.Types.ObjectId(id))
            .lean<IPhase>()
            .exec();
    }

    async find(filters: GetPhasesOptions) {
        const query: any = {};

        if (filters.project) {
            query.project = new mongoose.Types.ObjectId(filters.project);
        }

        return Phase.find(query)
            .populate([
                { path: 'project' }
            ])
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

    async update(id: string, dtoData: UpdatePhaseDto["data"]): Promise<IPhase> {
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
        const updated = await Phase.findByIdAndUpdate(
            new mongoose.Types.ObjectId(id),
            { $set: updateData },
            { new: true, runValidators: true }
        )
            .exec();

        if (!updated) throw new Error("Phase not found");
        return updated;
    }

    async delete(id: string) {
        return await Phase.findByIdAndDelete(new mongoose.Types.ObjectId(id))
            .exec();
    }
}