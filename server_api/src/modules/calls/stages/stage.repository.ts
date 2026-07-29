import mongoose, { ClientSession } from "mongoose";
import {
    CreateStageDTO,
    ExistsStageDTO,
    GetStageDTO,
    UpdateStageDTO
} from "./stage.dto";
import { IStage, Stage } from "./stage.model";

export interface IStageRepository {
    findById(id: string, session?: ClientSession): Promise<IStage | null>;
    find(filters: GetStageDTO): Promise<IStage[]>;
    findOne(callId: string, order: number, session?: ClientSession): Promise<IStage | null>;
    create(dto: CreateStageDTO): Promise<IStage>;
    update(id: string, data: UpdateStageDTO["data"]): Promise<IStage | null>;
    updateMany(filter: any, update: any): Promise<any>;
    countStages(callId: string, session?: ClientSession): Promise<number>;
    exists(filters: ExistsStageDTO): Promise<boolean>;
    delete(id: string): Promise<IStage | null>;
}

export class StageRepository implements IStageRepository {

    async findById(id: string, session?: ClientSession) {
        let query = Stage.findById(id);

        if (session) query = query.session(session);

        return query.lean<IStage>().exec();
    }

    async find(filters: GetStageDTO) {
        const query: any = {};

        if (filters.call) {
            query.call = new mongoose.Types.ObjectId(filters.call);
        }

        if (filters.evaluation) {
            query.evaluation = new mongoose.Types.ObjectId(filters.evaluation);
        }

        if (filters.order !== undefined) {
            query.order = filters.order;
        }

        let dbQuery = Stage.find(query).sort({ order: 1 });

        if (filters.populate) {
            dbQuery = dbQuery
                .populate("call")
                .populate("evaluation")
                .populate("template");
        }

        return dbQuery.lean<IStage[]>().exec();
    }

    async findOne(callId: string, order: number, session?: ClientSession) {
        let query = Stage.findOne({ call: callId, order });

        if (session) query = query.session(session);

        return query.lean<IStage>().exec();
    }

    async create(dto: CreateStageDTO) {
        return Stage.create({
            ...dto,
            call: new mongoose.Types.ObjectId(dto.call),
            evaluation: new mongoose.Types.ObjectId(dto.evaluation),
            template: dto.template
                ? new mongoose.Types.ObjectId(dto.template)
                : undefined,
        });
    }

    async update(id: string, data: UpdateStageDTO["data"]) {

        const updateData: any = { ...data };

        if (data.template !== undefined) {
            updateData.template = data.template
                ? new mongoose.Types.ObjectId(data.template)
                : null;
        }

        return Stage.findByIdAndUpdate(
            id,
            { $set: updateData },
            {
                new: true,
                runValidators: true,
            }
        ).exec();
    }

    async updateMany(filter: any, update: any) {
        return Stage.updateMany(filter, update).exec();
    }

    async countStages(callId: string, session?: ClientSession) {
        let query = Stage.countDocuments({
            call: new mongoose.Types.ObjectId(callId),
        });

        if (session) query = query.session(session);

        return query.exec();
    }

    async exists(filters: ExistsStageDTO) {
        const query: any = {};

        if (filters.call) {
            query.call = new mongoose.Types.ObjectId(filters.call);
        }

        if (filters.evaluation) {
            query.evaluation = new mongoose.Types.ObjectId(filters.evaluation);
        }

        if (filters.order !== undefined) {
            query.order = filters.order;
        }

        return (await Stage.exists(query).exec()) !== null;
    }

    async delete(id: string) {
        return Stage.findByIdAndDelete(id).exec();
    }
}