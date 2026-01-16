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

        if (filters.directorate) {
            query.directorate = new mongoose.Types.ObjectId(filters.directorate);
        }

        return Evaluation.find(query)
            .populate("directorate")
            .lean<IEvaluation[]>()
            .exec();
    }

    async create(dto: CreateEvaluationDTO) {
        const data: Partial<IEvaluation> = {
            directorate: new mongoose.Types.ObjectId(dto.directorate),
            title: dto.title,
        };
        return Evaluation.create(data);
    }

    async update(id: string, dtoData: UpdateEvaluationDTO["data"]): Promise<IEvaluation | null> {
        const updateData: Partial<IEvaluation> = {};

        if (dtoData.title) updateData.title = dtoData.title;

        return Evaluation.findByIdAndUpdate(
            new mongoose.Types.ObjectId(id),
            { $set: updateData },
            { new: true }
        ).exec();
    }

    async delete(id: string) {
        return await Evaluation.findByIdAndDelete(id).exec();
    }
}