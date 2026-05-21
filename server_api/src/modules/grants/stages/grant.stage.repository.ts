import mongoose, { ClientSession } from "mongoose";
import { CreateStageDTO, ExistsStageDTO, GetStageDTO, UpdateStageDTO } from "./grant.stage.dto";
import { IGrantStage, GrantStage, StageCategory } from "./grant.stage.model";

export interface IGrantStageRepository {
    findById(id: string, session?: ClientSession): Promise<IGrantStage | null>;
    find(filters: GetStageDTO): Promise<IGrantStage[]>;
    findOne(grantId: string, order: number, session?: ClientSession): Promise<IGrantStage | null>;
    create(dto: CreateStageDTO): Promise<IGrantStage>;
    update(id: string, data: UpdateStageDTO["data"]): Promise<IGrantStage | null>;
    updateMany(filter: any, update: any): Promise<any>;
    countSelectionStages(grantId: string, session?: ClientSession): Promise<number>;
    exists(filters: ExistsStageDTO): Promise<boolean>;
    delete(id: string): Promise<IGrantStage | null>;
}


export class GrantStageRepository implements IGrantStageRepository {

    async findById(
        id: string,
        session?: ClientSession
    ) {
        let dbQuery = GrantStage.findById(
            new mongoose.Types.ObjectId(id)
        );

        if (session) {
            dbQuery = dbQuery.session(session);
        }

        return dbQuery
            .lean<IGrantStage>()
            .exec();
    }

    async find(filters: GetStageDTO) {
        const query: any = {};

        if (filters.grant) {
            query.grant = new mongoose.Types.ObjectId(filters.grant);
        }
        if (filters.evaluation) {
            query.evaluation = new mongoose.Types.ObjectId(filters.evaluation);
        }

        if (filters.order) {
            query.order = filters.order;
        }

        let dbQuery = GrantStage.find(query).sort({ order: 1 });

        if (filters.populate) {
            dbQuery = dbQuery
                .populate('grant')
                .populate('evaluation');
        }

        return dbQuery.lean<IGrantStage[]>().exec();
    }

    async findOne(grantId: string, order: number, session?: ClientSession) {
        const query = GrantStage.findOne({ grant: grantId, order });

        if (session) {
            query.session(session);
        }

        return query
            .lean<IGrantStage>()
            .exec();
    }

    async create(dto: CreateStageDTO) {
        return GrantStage.create({
            ...dto, grant: new mongoose.Types.ObjectId(dto.grant),
            evaluation: new mongoose.Types.ObjectId(dto.evaluation)
        });
    }

    async update(
        id: string,
        dtoData: UpdateStageDTO["data"]
    ): Promise<IGrantStage | null> {
        const updateData: Partial<IGrantStage> = {};

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

        /*
        if (dtoData.decisionMode !== undefined) {
            updateData.decisionMode = dtoData.decisionMode;
        }*/

        // NEW: acceptance threshold
        if (dtoData.minAcceptanceScore !== undefined) {
            updateData.minAcceptanceScore = dtoData.minAcceptanceScore;
        }

        /*
        if (dtoData.evaluation !== undefined) {
            updateData.evaluation = new mongoose.Types.ObjectId(dtoData.evaluation);
        }
        */

        return GrantStage.findByIdAndUpdate(
            new mongoose.Types.ObjectId(id),
            { $set: updateData },
            { new: true }
        ).exec();
    }

    async updateMany(filter: any, update: any) {
        return GrantStage.updateMany(filter, update).exec();
    }

    async countSelectionStages(
        grantId: string,
        session?: ClientSession
    ) {
        let dbQuery = GrantStage.countDocuments({
            grant: new mongoose.Types.ObjectId(grantId),
            category: StageCategory.selection
        });

        if (session) {
            dbQuery = dbQuery.session(session);
        }
        return dbQuery.exec();
    }

    async exists(filters: ExistsStageDTO): Promise<boolean> {
        const query: any = {};

        const { grant, evaluation, order } = filters;

        if (grant) {
            query.grant = new mongoose.Types.ObjectId(grant);
        }

        if (evaluation) {
            query.evaluation = new mongoose.Types.ObjectId(evaluation);
        }

        if (order !== undefined) {
            query.order = order;
        }

        const result = await GrantStage.exists(query).exec();
        return result !== null;
    }
    async delete(id: string) {
        return await GrantStage.findByIdAndDelete(id).exec();
    }
}