import mongoose from "mongoose";
import { Evaluation, IEvaluation } from "./evaluation.model";
import {
    CreateEvaluationDTO,
    GetEvaluationsDTO,
    UpdateEvaluationDTO
} from "./evaluation.dto";

export interface IEvaluationRepository {
    findById(id: string): Promise<IEvaluation | null>;
    find(filters: GetEvaluationsDTO): Promise<Partial<IEvaluation>[]>;
    create(dto: CreateEvaluationDTO): Promise<IEvaluation>;
    update(id: string, data: UpdateEvaluationDTO["data"]): Promise<IEvaluation | null>;
    delete(id: string): Promise<IEvaluation | null>;
}

// MongoDB implementation
export class EvaluationRepository implements IEvaluationRepository {

    async findById(id: string) {
        return Evaluation.findById(new mongoose.Types.ObjectId(id))
            .lean<IEvaluation>()
            .exec();
    }

    async find(filters: GetEvaluationsDTO) {
        const query: any = {};

        if (filters.status) {
            query.status = filters.status;
        }

        return Evaluation.find(query).lean<IEvaluation[]>().exec();
    }

    async create(dto: CreateEvaluationDTO) {
        const data: Partial<IEvaluation> = {
            ...dto
        };
        return Evaluation.create(data);
    }

    async update(id: string, dtoData: UpdateEvaluationDTO["data"]): Promise<IEvaluation | null> {
        const updateData: Partial<IEvaluation> = {};

        if (dtoData.title) updateData.title = dtoData.title;
        if (dtoData.weight) updateData.weight = dtoData.weight;
        if (dtoData.description) updateData.description = dtoData.description;
        if (dtoData.status) updateData.status = dtoData.status;

        return Evaluation.findByIdAndUpdate(
            new mongoose.Types.ObjectId(id),
            { $set: updateData },
            { new: true }
        ).exec();
    }

    async delete(id: string) {
        return Evaluation.findByIdAndDelete(id).exec();
    }
}