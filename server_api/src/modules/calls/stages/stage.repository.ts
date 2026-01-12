import mongoose from "mongoose";
import { CreateStageDTO, FindStageDTO, GetStageDTO, UpdateStageDTO } from "./stage.dto";
import { IStage, Stage } from "./stage.model";


export interface IStageRepository {
    findById(id: string): Promise<IStage | null>;
    find(filters: GetStageDTO): Promise<Partial<IStage>[]>;
    findOne(option: FindStageDTO): Promise<IStage | null>;
    create(dto: CreateStageDTO): Promise<IStage>;
    update(id: string, data: UpdateStageDTO["data"]): Promise<IStage | null>;
    updateMany(filter: any, update: any): Promise<any>;
    delete(id: string): Promise<IStage | null>;
}


export class StageRepository implements IStageRepository {

    async findById(id: string) {
        return Stage.findById(new mongoose.Types.ObjectId(id))
            .lean<IStage>()
            .exec();
    }

    async findOne(option: FindStageDTO) {
        return Stage.findOne({
            call: new mongoose.Types.ObjectId(option.call),
            order: option.order
        })
            .lean<IStage>()
            .exec();
    }

    async find(filters: GetStageDTO) {
        const query: any = {};

        if (filters.call) {
            query.call = new mongoose.Types.ObjectId(filters.call);
        }

        if (filters.status) {
            query.status = filters.status;
        }

        let dbQuery = Stage.find(query);

        if (filters.populate) {
            dbQuery = dbQuery
                .populate('call')
                .populate('evaluation');
        }

        return dbQuery.lean<IStage[]>().exec();
    }

    async create(dto: CreateStageDTO) {
        return Stage.create({
            ...dto, call: new mongoose.Types.ObjectId(dto.call),
            evaluation: new mongoose.Types.ObjectId(dto.evaluation)
        });
    }

    async update(id: string, dtoData: UpdateStageDTO["data"]): Promise<IStage | null> {
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
        return Stage.findByIdAndUpdate(
            new mongoose.Types.ObjectId(id),
            { $set: updateData },
            { new: true }
        ).exec();
    }

    async updateMany(filter: any, update: any) {
        return Stage.updateMany(filter, update).exec();
    }

    async delete(id: string) {
        return await Stage.findByIdAndDelete(id).exec();
    }
}