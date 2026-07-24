import mongoose, { ClientSession } from "mongoose";
import { CreateStageDTO, ExistsStageDTO, GetStageDTO, UpdateStageDTO } from "./stage.dto";
import { IStage, Stage } from "./stage.model";

export interface IStageRepository {
    findById(id: string, session?: ClientSession): Promise<IStage | null>;
    find(filters: GetStageDTO): Promise<IStage[]>;
    findOne(callId: string, order: number, session?: ClientSession): Promise<IStage | null>;
    //findUpcomingVerifications(grantId?: string): Promise<IStage[]>;
    create(dto: CreateStageDTO): Promise<IStage>;
    update(id: string, data: UpdateStageDTO["data"]): Promise<IStage | null>;
    updateMany(filter: any, update: any): Promise<any>;
    countStages(callId: string, session?: ClientSession): Promise<number>;
    exists(filters: ExistsStageDTO): Promise<boolean>;
    delete(id: string): Promise<IStage | null>;
}


export class StageRepository implements IStageRepository {

    async findById(
        id: string,
        session?: ClientSession
    ) {
        let dbQuery = Stage.findById(
            new mongoose.Types.ObjectId(id)
        );

        if (session) {
            dbQuery = dbQuery.session(session);
        }

        return dbQuery
            .lean<IStage>()
            .exec();
    }

    async find(filters: GetStageDTO) {
        const query: any = {};

        if (filters.call) {
            query.call = new mongoose.Types.ObjectId(filters.call);
        }
        if (filters.evaluation) {
            query.evaluation = new mongoose.Types.ObjectId(filters.evaluation);
        }

        if (filters.order) {
            query.order = filters.order;
        }

        let dbQuery = Stage.find(query).sort({ order: 1 });

        if (filters.populate) {
            dbQuery = dbQuery
                .populate('call')
                .populate('evaluation');
        }

        return dbQuery.lean<IStage[]>().exec();
    }

    async findOne(callId: string, order: number, session?: ClientSession) {
        const query = Stage.findOne({ call: callId, order });

        if (session) {
            query.session(session);
        }

        return query
            .lean<IStage>()
            .exec();
    }



    async create(dto: CreateStageDTO) {
        return Stage.create({
            ...dto, call: new mongoose.Types.ObjectId(dto.call),
            evaluation: new mongoose.Types.ObjectId(dto.evaluation)
        });
    }

    async update(
        id: string,
        dtoData: UpdateStageDTO["data"]
    ): Promise<IStage | null> {
        const updateData: Partial<IStage> = {};

        if (dtoData.name !== undefined) {
            updateData.name = dtoData.name;
        }

        /*
        if (dtoData.order !== undefined) {
            updateData.order = dtoData.order;
        }
            */

        if (dtoData.minReviewers !== undefined) {
            updateData.minReviewers = dtoData.minReviewers;
        }

        if (dtoData.maxReviewers !== undefined) {
            updateData.maxReviewers = dtoData.maxReviewers;
        }
        if (dtoData.minAcceptanceScore !== undefined) {
            updateData.minAcceptanceScore = dtoData.minAcceptanceScore;
        }

        if (dtoData.deadline) updateData.deadline = dtoData.deadline;

        return Stage.findByIdAndUpdate(
            new mongoose.Types.ObjectId(id),
            { $set: updateData },
            { new: true }
        ).exec();
    }

    async updateMany(filter: any, update: any) {
        return Stage.updateMany(filter, update).exec();
    }

    async countStages(
        callId: string,
        session?: ClientSession
    ) {
        let dbQuery = Stage.countDocuments({
            call: new mongoose.Types.ObjectId(callId),
            //category: category
        });

        if (session) {
            dbQuery = dbQuery.session(session);
        }
        return dbQuery.exec();
    }

    async exists(filters: ExistsStageDTO): Promise<boolean> {
        const query: any = {};

        const { call: call, evaluation, order } = filters;

        if (call) {
            query.call = new mongoose.Types.ObjectId(call);
        }

        if (evaluation) {
            query.evaluation = new mongoose.Types.ObjectId(evaluation);
        }

        if (order !== undefined) {
            query.order = order;
        }

        const result = await Stage.exists(query).exec();
        return result !== null;
    }
    async delete(id: string) {
        return await Stage.findByIdAndDelete(id).exec();
    }
}