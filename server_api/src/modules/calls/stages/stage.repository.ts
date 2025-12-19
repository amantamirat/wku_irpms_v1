import mongoose from "mongoose";
import { CreateStageDTO, FilterStageDTO, UpdateStageDTO } from "./stage.dto";
import { IStage, Stage } from "./stage.model";
import { UpdateStatusDTO } from "./documents/document.dto";

export interface IStageRepository {
    findOne(filters: FilterStageDTO): Promise<IStage | null>;
    find(filters: FilterStageDTO, populate?: boolean): Promise<Partial<IStage>[]>;
    findLastStageByCall(callId: string): Promise<IStage | null>;
    create(dto: CreateStageDTO): Promise<IStage>;
    update(id: string, data: UpdateStageDTO["data"] | UpdateStatusDTO["data"]): Promise<IStage>;
    delete(id: string): Promise<IStage | null>;
}


export class StageRepository implements IStageRepository {

    async findOne(options: FilterStageDTO) {
        const query: any = {};
        if (options._id) {
            query._id = new mongoose.Types.ObjectId(options._id);
        }
        if (options.call) {
            query.call = new mongoose.Types.ObjectId(options.call);
        }
        if (options.order) {
            query.order = options.order;
        }
        if (options.isFinal === true) {
            query.isFinal = true;
        }
        return Stage.findOne(query).lean<IStage>();
    }

    async findLastStageByCall(callId: string): Promise<IStage | null> {
        return await Stage
            .findOne({ call: callId })
            .sort({ order: -1 })
            .lean<IStage>();
    }

    async find(filters: FilterStageDTO, populate: boolean = true) {
        const query: any = {};
        if (filters.call) {
            query.call = new mongoose.Types.ObjectId(filters.call);
        }

        if (filters.status) {
            query.status = filters.status;
        }
        if (populate === false) {
            return Stage.find(query)
                .lean<IStage[]>()
                .exec();
        }
        return Stage.find(query)
            .populate("call")
            .populate("evaluation")
            .lean<IStage[]>()
            .exec();
    }

    async create(dto: CreateStageDTO) {
        return Stage.create({
            ...dto, call: new mongoose.Types.ObjectId(dto.call),
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
        if (dtoData.isFinal !== undefined) {
            updateData.isFinal = dtoData.isFinal;
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