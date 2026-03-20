import mongoose from "mongoose";
import { CreateStageDTO, ExistsStageDTO, GetStageDTO, UpdateStageDTO } from "./grant.stage.dto";
import { IGrantStage, GrantStage } from "./grant.stage.model";

export interface IGrantStageRepository {
    findById(id: string): Promise<IGrantStage | null>;
    find(filters: GetStageDTO): Promise<Partial<IGrantStage>[]>;
    create(dto: CreateStageDTO): Promise<IGrantStage>;
    update(id: string, data: UpdateStageDTO["data"]): Promise<IGrantStage | null>;
    updateMany(filter: any, update: any): Promise<any>;
    exists(filters: ExistsStageDTO): Promise<boolean>;
    delete(id: string): Promise<IGrantStage | null>;
}


export class GrantStageRepository implements IGrantStageRepository {

    async findById(id: string) {
        return GrantStage.findById(new mongoose.Types.ObjectId(id))
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

        let dbQuery = GrantStage.find(query);

        if (filters.populate) {
            dbQuery = dbQuery
                .populate('grant')
                .populate('evaluation');
        }

        return dbQuery.lean<IGrantStage[]>().exec();
    }

    async create(dto: CreateStageDTO) {
        return GrantStage.create({
            ...dto, grant: new mongoose.Types.ObjectId(dto.grant),
            evaluation: new mongoose.Types.ObjectId(dto.evaluation)
        });
    }

    async update(id: string, dtoData: UpdateStageDTO["data"]): Promise<IGrantStage | null> {
        const updateData: Partial<IGrantStage> = {};
        if (dtoData.name !== undefined) {
            updateData.name = dtoData.name;
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

    async exists(filters: ExistsStageDTO): Promise<boolean> {
        const query: any = {};
        const { grant, evaluation } = filters;
        if (grant) {
            query.grant = new mongoose.Types.ObjectId(grant);
        }
        if (evaluation) {
            query.evaluation = new mongoose.Types.ObjectId(evaluation);
        }
        const result = await GrantStage.exists(query).exec();
        return result !== null;
    }

    async delete(id: string) {
        return await GrantStage.findByIdAndDelete(id).exec();
    }
}