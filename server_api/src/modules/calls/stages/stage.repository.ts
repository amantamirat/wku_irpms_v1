import mongoose from "mongoose";
import { CreateStageDTO, FindStageDTO, GetStageDTO, UpdateStageDTO } from "./stage.dto";
import { ICallStage, CallStage } from "./stage.model";


export interface IStageRepository {
    findById(id: string): Promise<ICallStage | null>;
    find(filters: GetStageDTO): Promise<Partial<ICallStage>[]>;
    findOne(option: FindStageDTO): Promise<ICallStage | null>;
    create(dto: CreateStageDTO): Promise<ICallStage>;
    update(id: string, data: UpdateStageDTO["data"]): Promise<ICallStage | null>;
    updateMany(filter: any, update: any): Promise<any>;
    delete(id: string): Promise<ICallStage | null>;
}


export class StageRepository implements IStageRepository {

    async findById(id: string) {
        return CallStage.findById(new mongoose.Types.ObjectId(id))
            .lean<ICallStage>()
            .exec();
    }

    async findOne(option: FindStageDTO) {
        return CallStage.findOne({
            call: new mongoose.Types.ObjectId(option.call),
            order: option.order
        })
            .lean<ICallStage>()
            .exec();
    }

    async find(filters: GetStageDTO) {
        const query: any = {};

        if (filters.call) {
            query.call = new mongoose.Types.ObjectId(filters.call);
        }

        if (filters.order) {
            query.order = filters.order;
        }

        if (filters.status) {
            query.status = filters.status;
        }

        let dbQuery = CallStage.find(query);

        if (filters.populate) {
            dbQuery = dbQuery
                .populate('call')
                .populate('evaluation');
        }

        return dbQuery.lean<ICallStage[]>().exec();
    }

    async create(dto: CreateStageDTO) {
        return CallStage.create({
            ...dto, call: new mongoose.Types.ObjectId(dto.call),
            evaluation: new mongoose.Types.ObjectId(dto.evaluation)
        });
    }

    async update(id: string, dtoData: UpdateStageDTO["data"]): Promise<ICallStage | null> {
        const updateData: Partial<ICallStage> = {};
        
        if (dtoData.deadline !== undefined) {
            updateData.deadline = dtoData.deadline;
        }
        /*
        if (dtoData.name !== undefined) {
            updateData.name = dtoData.name;
        }
        if (dtoData.evaluation !== undefined) {
            updateData.evaluation = new mongoose.Types.ObjectId(dtoData.evaluation);
        }
            */
        if (dtoData.status !== undefined) {
            updateData.status = dtoData.status;
        }
        return CallStage.findByIdAndUpdate(
            new mongoose.Types.ObjectId(id),
            { $set: updateData },
            { new: true }
        ).exec();
    }

    async updateMany(filter: any, update: any) {
        return CallStage.updateMany(filter, update).exec();
    }

    async delete(id: string) {
        return await CallStage.findByIdAndDelete(id).exec();
    }
}