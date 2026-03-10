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
            grant: new mongoose.Types.ObjectId(option.grant),
            order: option.order
        })
            .lean<IStage>()
            .exec();
    }

    async find(filters: GetStageDTO) {
        const query: any = {};

        if (filters.grant) {
            query.grant = new mongoose.Types.ObjectId(filters.grant);
        }

        if (filters.order) {
            query.order = filters.order;
        }

        let dbQuery = Stage.find(query);

        if (filters.populate) {
            dbQuery = dbQuery
                .populate('grant')
                .populate('evaluation');
        }

        return dbQuery.lean<IStage[]>().exec();
    }

    async create(dto: CreateStageDTO) {
        return Stage.create({
            ...dto, grant: new mongoose.Types.ObjectId(dto.grant),
            evaluation: new mongoose.Types.ObjectId(dto.evaluation)
        });
    }

    async update(id: string, dtoData: UpdateStageDTO["data"]): Promise<IStage | null> {
        const updateData: Partial<IStage> = {};
        if (dtoData.name !== undefined) {
            updateData.name = dtoData.name;
        }

        if (dtoData.evaluation !== undefined) {
            updateData.evaluation = new mongoose.Types.ObjectId(dtoData.evaluation);
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