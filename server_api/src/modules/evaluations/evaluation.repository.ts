import mongoose from "mongoose";
import { Evaluation, IEvaluation } from "./evaluation.model";
import {
    CreateEvaluationDTO,
    FilterEvaluationsDTO,
    UpdateEvaluationDTO
} from "./evaluation.dto";

export interface IEvaluationRepository {
    findById(id: string): Promise<IEvaluation | null>;
    findOne(filters: FilterEvaluationsDTO): Promise<IEvaluation | null>;
    find(filters: FilterEvaluationsDTO): Promise<Partial<IEvaluation>[]>;
    create(dto: CreateEvaluationDTO): Promise<IEvaluation>;
    update(
        id: string,
        data: UpdateEvaluationDTO["data"]
    ): Promise<IEvaluation | null>;
    delete(id: string): Promise<IEvaluation | null>;
}

export class EvaluationRepository implements IEvaluationRepository {

    // ==================================================
    // BUILD FILTER
    // ==================================================

    private buildFilter(filters: FilterEvaluationsDTO) {
        const query: Record<string, unknown> = {};

        if (filters.title) {
            query.title = filters.title;
        }

        if (filters.weight !== undefined) {
            query.weight = filters.weight;
        }

        if (filters.status) {
            query.status = filters.status;
        }

        return query;
    }

    // ==================================================
    // FIND BY ID
    // ==================================================

    async findById(id: string): Promise<IEvaluation | null> {
        return Evaluation.findById(
            new mongoose.Types.ObjectId(id)
        )
            .lean<IEvaluation>()
            .exec();
    }

    // ==================================================
    // FIND ONE
    // ==================================================

    async findOne(
        filters: FilterEvaluationsDTO
    ): Promise<IEvaluation | null> {

        const query = this.buildFilter(filters);

        return Evaluation.findOne(query)
            .lean<IEvaluation>()
            .exec();
    }

    // ==================================================
    // FIND MANY
    // ==================================================

    async find(
        filters: FilterEvaluationsDTO
    ): Promise<Partial<IEvaluation>[]> {

        const query = this.buildFilter(filters);

        return Evaluation.find(query)
            .lean<IEvaluation[]>()
            .exec();
    }

    // ==================================================
    // CREATE
    // ==================================================

    async create(dto: CreateEvaluationDTO): Promise<IEvaluation> {
        const data: Partial<IEvaluation> = {
            ...dto
        };

        return Evaluation.create(data);
    }

    // ==================================================
    // UPDATE
    // ==================================================

    async update(
        id: string,
        dtoData: UpdateEvaluationDTO["data"]
    ): Promise<IEvaluation | null> {

        const updateData: Partial<IEvaluation> = {};

        if (dtoData.title !== undefined) {
            updateData.title = dtoData.title;
        }

        if (dtoData.weight !== undefined) {
            updateData.weight = dtoData.weight;
        }

        if (dtoData.description !== undefined) {
            updateData.description = dtoData.description;
        }

        if (dtoData.status !== undefined) {
            updateData.status = dtoData.status;
        }

        return Evaluation.findByIdAndUpdate(
            new mongoose.Types.ObjectId(id),
            { $set: updateData },
            { new: true }
        ).exec();
    }

    // ==================================================
    // DELETE
    // ==================================================

    async delete(id: string): Promise<IEvaluation | null> {
        return Evaluation.findByIdAndDelete(id).exec();
    }
}