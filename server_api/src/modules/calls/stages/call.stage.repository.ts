import mongoose from "mongoose";
import { CreateStageDTO, ExistsStageDTO, GetStageDTO, UpdateStageDTO } from "./call.stage.dto";
import { ICallStage, CallStage } from "./call.stage.model";

export interface ICallStageRepository {
    findById(id: string): Promise<ICallStage | null>;
    find(filters: GetStageDTO): Promise<Partial<ICallStage>[]>;
    create(dto: CreateStageDTO): Promise<ICallStage>;
    createMany(dtos: CreateStageDTO[]): Promise<ICallStage[]>;
    update(id: string, data: UpdateStageDTO["data"]): Promise<ICallStage | null>;
    exists(filters: ExistsStageDTO): Promise<boolean>;
    delete(id: string): Promise<ICallStage | null>;
    deleteByCall(callId: string): Promise<any>;
}


export class CallStageRepository implements ICallStageRepository {

    async findById(id: string) {
        return CallStage.findById(new mongoose.Types.ObjectId(id))
            .lean<ICallStage>()
            .exec();
    }


    async find(filters: GetStageDTO) {
        const query: any = {};

        if (filters.call) {
            query.call = new mongoose.Types.ObjectId(filters.call);
        }

        if (filters.grantStage) {
            query.grantStage = new mongoose.Types.ObjectId(filters.grantStage);
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
                .populate('grantStage');
        }

        return dbQuery.lean<ICallStage[]>().exec();
    }

    async create(dto: CreateStageDTO) {
        return CallStage.create({
            ...dto, call: new mongoose.Types.ObjectId(dto.call),
            grantStage: new mongoose.Types.ObjectId(dto.grantStage)
        });
    }

    async createMany(dtos: CreateStageDTO[]): Promise<ICallStage[]> {
        const payload = dtos.map(dto => ({
            ...dto,
            call: new mongoose.Types.ObjectId(dto.call),
            grantStage: new mongoose.Types.ObjectId(dto.grantStage)
        }));

        const docs = await CallStage.insertMany(payload);
        return docs as ICallStage[]; // 👈 key fix
    }

    async update(id: string, dtoData: UpdateStageDTO["data"]): Promise<ICallStage | null> {
        const updateData: Partial<ICallStage> = {};

        if (dtoData.deadline !== undefined) {
            updateData.deadline = dtoData.deadline;
        }

        if (dtoData.status !== undefined) {
            updateData.status = dtoData.status;
        }
        return CallStage.findByIdAndUpdate(
            new mongoose.Types.ObjectId(id),
            { $set: updateData },
            { new: true }
        ).exec();
    }

    async exists(filters: ExistsStageDTO): Promise<boolean> {
        const query: any = {};
        const { call, grantStage, status } = filters;
        if (grantStage) {
            query.grantStage = new mongoose.Types.ObjectId(grantStage);
        }
        if (call) {
            query.call = new mongoose.Types.ObjectId(call);
        }
        if (status) {
            query.status = status;
        }
        const result = await CallStage.exists(query).exec();
        return result !== null;
    }

    async delete(id: string) {
        return CallStage.findByIdAndDelete(id).exec();
    }

    async deleteByCall(callId: string) {
        return CallStage.deleteMany({
            call: new mongoose.Types.ObjectId(callId)
        }).exec();
    }
}