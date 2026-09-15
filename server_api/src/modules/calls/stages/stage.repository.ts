
import {
    CreateStageDTO,
    FilterStageDto,
    UpdateStageDTO
} from "./stage.dto";
import { IStage, Stage } from "./stage.model";
import { FilterOptions } from "../../../common/dtos/filter.dto";


export interface IStageRepository {
    findById(id: string): Promise<IStage | null>;
    find(
        filters: FilterStageDto,
        options?: FilterOptions
    ): Promise<IStage[]>;

    findOne(
        callId: string,
        order: number
    ): Promise<IStage | null>;

    getFirstStage(callId: string): Promise<IStage | null>;
    getLastStage(callId: string): Promise<IStage | null>;
    getNextStage(
        callId: string,
        currentOrder: number
    ): Promise<IStage | null>;

    findUpcoming(options?: FilterOptions): Promise<IStage[]>;

    create(dto: CreateStageDTO): Promise<IStage>;

    update(
        id: string,
        data: UpdateStageDTO["data"]
    ): Promise<IStage | null>;

    updateMany(filter: any, update: any): Promise<any>;

    countStages(callId: string): Promise<number>;

    exists(filters: FilterStageDto): Promise<boolean>;

    delete(id: string): Promise<IStage | null>;
}


export class StageRepository implements IStageRepository {

    async findById(id: string): Promise<IStage | null> {
        return Stage.findById(id)
            .lean<IStage>()
            .exec();
    }


    async find(
        filters: FilterStageDto,
        options?: FilterOptions
    ): Promise<IStage[]> {

        const query: any = {};

        if (filters.call) {
            query.call = filters.call;
        }

        if (filters.evaluation) {
            query.evaluation = filters.evaluation;
        }

        if (filters.order !== undefined) {
            query.order = filters.order;
        }

        let dbQuery = Stage
            .find(query)
            .sort({ order: 1 });

        if (options?.populate) {
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


    async getFirstStage(
        callId: string
    ): Promise<IStage | null> {

        return Stage.findOne({
            call: callId
        })
            .sort({ order: 1 })
            .lean<IStage>()
            .exec();
    }


    async getLastStage(
        callId: string
    ): Promise<IStage | null> {

        return Stage.findOne({
            call: callId
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
            call: callId,
            order: { $gt: currentOrder }
        })
            .sort({ order: 1 })
            .lean<IStage>()
            .exec();
    }


    async findUpcoming(
        options?: FilterOptions
    ): Promise<IStage[]> {

        let query = Stage
            .find({
                deadline: {
                    $gt: new Date()
                }
            })
            .sort({ deadline: 1 });

        if (options?.populate) {
            query = query.populate("call");
        }

        return query
            .lean<IStage[]>()
            .exec();
    }


    async create(
        dto: CreateStageDTO
    ): Promise<IStage> {

        return Stage.create(dto);
    }


    async update(
        id: string,
        data: UpdateStageDTO["data"]
    ): Promise<IStage | null> {

        return Stage.findByIdAndUpdate(
            id,
            { $set: data },
            {
                new: true,
                runValidators: true
            }
        )
            .lean<IStage>()
            .exec();
    }


    async updateMany(
        filter: any,
        update: any
    ): Promise<any> {

        return Stage
            .updateMany(filter, update)
            .exec();
    }


    async countStages(
        callId: string
    ): Promise<number> {

        return Stage
            .countDocuments({
                call: callId
            })
            .exec();
    }


    async exists(
        filters: FilterStageDto
    ): Promise<boolean> {

        const query: any = {};

        if (filters.call) {
            query.call = filters.call;
        }

        if (filters.evaluation) {
            query.evaluation = filters.evaluation;
        }

        if (filters.order !== undefined) {
            query.order = filters.order;
        }

        return (await Stage.exists(query).exec()) !== null;
    }


    async delete(
        id: string
    ): Promise<IStage | null> {

        return Stage
            .findByIdAndDelete(id)
            .exec();
    }
}
