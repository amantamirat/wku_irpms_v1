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
            .lean<IStage>()
            .exec();
    }

    async findLastStageByCycle(options: GetStagesDTO): Promise<IStage | null> {
        const query: any = {};
        if (options.call) {
            query.call = new mongoose.Types.ObjectId(options.call);
        }
        return Stage.findOne(query)
            .sort({ order: -1 }).lean<IStage>();
    }

    findByOrderAndCycle(options: GetStagesDTO): Promise<IStage | null> {
        const query: any = {};
        if (options.call) {
            query.call = new mongoose.Types.ObjectId(options.call);
        }
        if (options.order) {
            query.order = options.order;
        }
        return Stage.findOne(query).lean<IStage>();
    }

    async find(filters: GetStagesDTO) {
        const query: any = {};
        if (filters.call) {
            query.cycle = new mongoose.Types.ObjectId(filters.call);
        }

        if (filters.status) {
            query.status = filters.status;
        }
        return Stage.find(query)
            .populate("call")
            .populate("evaluation")
            .lean<IStage[]>()
            .exec();
    }

    async create(dto: CreateStageDTO) {
        return Stage.create({...dto, call: new mongoose.Types.ObjectId(dto.call),
            evaluation: new mongoose.Types.ObjectId(dto.evaluation)
        });
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