import { Types } from "mongoose";
import {
    CreateStageDTO,
    ExistsStageDTO,
    GetStageDTO,
    UpdateStageDTO
} from "./stage.dto";
import { IStage, Stage } from "./stage.model";


export interface IStageRepository {
    findById(id: string): Promise<IStage | null>;
    find(filters: GetStageDTO): Promise<IStage[]>;
    findOne(callId: string, order: number): Promise<IStage | null>;

    getFirstStage(callId: string): Promise<IStage | null>;
    getLastStage(callId: string): Promise<IStage | null>;
    getNextStage(callId: string, currentOrder: number): Promise<IStage | null>;

    create(dto: CreateStageDTO): Promise<IStage>;
    update(id: string, data: UpdateStageDTO["data"]): Promise<IStage | null>;
    updateMany(filter: any, update: any): Promise<any>;
    exists(filters: ExistsStageDTO): Promise<boolean>;
    delete(id: string): Promise<IStage | null>;
}


export class StageRepository implements IStageRepository {

    async findById(id: string): Promise<IStage | null> {
        return Stage.findById(id)
            .lean<IStage>()
            .exec();
    }


    async find(filters: GetStageDTO): Promise<IStage[]> {
        const query: any = {};

        if (filters.call) {
            query.call = new Types.ObjectId(filters.call);
        }

        if (filters.evaluation) {
            query.evaluation = new Types.ObjectId(filters.evaluation);
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

        return dbQuery
            .lean<IStage[]>()
            .exec();
    }


    async findOne(
        callId: string,
        order: number
    ): Promise<IStage | null> {
        return Stage.findOne({
            call: callId,
            order
        })
            .lean<IStage>()
            .exec();
    }


    async getFirstStage(callId: string): Promise<IStage | null> {
        return Stage.findOne({
            call: new Types.ObjectId(callId)
        })
            .sort({ order: 1 })
            .lean<IStage>()
            .exec();
    }

    async getLastStage(callId: string): Promise<IStage | null> {
        return Stage.findOne({
            call: new Types.ObjectId(callId)
        })
            .sort({ order: -1 })
            .lean<IStage>()
            .exec();
    }

    async getNextStage(
        callId: string,
        currentOrder: number
    ): Promise<IStage | null> {
        return Stage.findOne({
            call: new Types.ObjectId(callId),
            order: { $gt: currentOrder }
        })
            .sort({ order: 1 })
            .lean<IStage>()
            .exec();
    }


    async create(dto: CreateStageDTO): Promise<IStage> {
        return Stage.create({
            ...dto,
            call: new Types.ObjectId(dto.call),
            evaluation: new Types.ObjectId(dto.evaluation),
            template: dto.template
                ? new Types.ObjectId(dto.template)
                : undefined,
        });
    }


    async update(
        id: string,
        data: UpdateStageDTO["data"]
    ): Promise<IStage | null> {

        const updateData: any = { ...data };

        if (data.template !== undefined) {
            updateData.template = data.template
                ? new Types.ObjectId(data.template)
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


    async updateMany(filter: any, update: any): Promise<any> {
        return Stage.updateMany(filter, update).exec();
    }


    async countStages(callId: string): Promise<number> {
        return Stage.countDocuments({
            call: new Types.ObjectId(callId),
        }).exec();
    }


    async exists(filters: ExistsStageDTO): Promise<boolean> {
        const query: any = {};

        if (filters.call) {
            query.call = new Types.ObjectId(filters.call);
        }

        if (filters.evaluation) {
            query.evaluation = new Types.ObjectId(filters.evaluation);
        }

        if (filters.order !== undefined) {
            query.order = filters.order;
        }

        return (await Stage.exists(query).exec()) !== null;
    }


    async delete(id: string): Promise<IStage | null> {
        return Stage.findByIdAndDelete(id).exec();
    }
}