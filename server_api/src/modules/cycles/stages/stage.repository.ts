import mongoose from "mongoose";
import { CreateStageDTO, GetStagesDTO, UpdateStageDTO } from "./stage.dto";
import { IStage, Stage } from "./stage.model";

export interface IStageRepository {
    findById(id: string): Promise<IStage | null>;
    findLastStageByCycle(options: GetStagesDTO): Promise<IStage | null>;
    findByOrderAndCycle(options: GetStagesDTO): Promise<IStage | null>;
    find(filters: GetStagesDTO): Promise<Partial<IStage>[]>;
    create(dto: CreateStageDTO): Promise<IStage>;
    update(id: string, data: UpdateStageDTO["data"]): Promise<IStage>;
    delete(id: string): Promise<IStage | null>;
}


export class StageRepository implements IStageRepository {

    async findById(id: string) {
        return Stage.findById(new mongoose.Types.ObjectId(id))
            //.populate("cycle")
            //.populate("evaluation")
            .lean<IStage>()
            .exec();
    }

    async findLastStageByCycle(options: GetStagesDTO): Promise<IStage | null> {
        const query: any = {};
        if (options.cycle) {
            query.cycle = new mongoose.Types.ObjectId(options.cycle);
        }
        return Stage.findOne(query)
            .sort({ order: -1 }).lean<IStage>();
    }

    findByOrderAndCycle(options: GetStagesDTO): Promise<IStage | null> {
        const query: any = {};
        if (options.cycle) {
            query.cycle = new mongoose.Types.ObjectId(options.cycle);
        }
        if (options.order) {
            query.order = options.order;
        }
        return Stage.findOne(query).lean<IStage>();
    }

    async find(filters: GetStagesDTO) {
        const query: any = {};
        if (filters.cycle) {
            query.cycle = new mongoose.Types.ObjectId(filters.cycle);
        }

        if (filters.status) {
            query.status = filters.status;
        }
        return Stage.find(query)
            .populate("cycle")
            .populate("evaluation")
            .lean<IStage[]>()
            .exec();
    }

    async create(dto: CreateStageDTO) {
        const data: Partial<IStage> = {
            cycle: new mongoose.Types.ObjectId(dto.cycle),
            name: dto.name,
            type: dto.type,
            evaluation: new mongoose.Types.ObjectId(dto.evaluation),
            deadline: dto.deadline
        };
        return Stage.create(data);
    }

    async update(id: string, dtoData: UpdateStageDTO["data"]): Promise<IStage> {
        const updateData: Partial<IStage> = {};

        if (dtoData.name !== undefined) {
            updateData.name = dtoData.name;
        }


        if (dtoData.deadline !== undefined) {
            updateData.deadline = dtoData.deadline;
        }

        if (dtoData.evaluation !== undefined) {
            updateData.evaluation = new mongoose.Types.ObjectId(dtoData.evaluation);
        }

        if (dtoData.status !== undefined) {
            updateData.status = dtoData.status;
        }
        const updated = await Stage.findByIdAndUpdate(
            new mongoose.Types.ObjectId(id),
            { $set: updateData },
            { new: true }
        ).exec();

        if (!updated) throw new Error("Stage not found");
        return updated;
    }

    async delete(id: string) {
        return await Stage.findByIdAndDelete(id).exec();
    }
}