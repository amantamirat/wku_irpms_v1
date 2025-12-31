import mongoose from "mongoose";
import { Criterion, ICriterion } from "./criterion.model";
import {
    CreateCriterionDTO,
    GetCriteriaDTO,
    UpdateCriterionDTO
} from "./criterion.dto";

//Criterion

export interface ICriterionRepository {
    findById(id: string): Promise<ICriterion | null>;
    find(filters: GetCriteriaDTO): Promise<Partial<ICriterion>[]>;
    create(dto: CreateCriterionDTO): Promise<ICriterion>;
    update(id: string, data: UpdateCriterionDTO["data"]): Promise<ICriterion>;
    countDocuments(evaluation: string): Promise<number>;
    delete(id: string): Promise<ICriterion | null>;
}

// MongoDB implementation
export class CriterionRepository implements ICriterionRepository {

    async findById(id: string) {
        return Criterion.findById(new mongoose.Types.ObjectId(id))
            .lean<ICriterion>()
            .exec();
    }

    async find(filters: GetCriteriaDTO) {
        const query: any = {};

        if (filters.evaluation) {
            query.evaluation = new mongoose.Types.ObjectId(filters.evaluation);
        }

        return Criterion.find(query)
            .populate("evaluation")
            .lean<ICriterion[]>()
            .exec();
    }

    async create(dto: CreateCriterionDTO) {
        const data: Partial<ICriterion> = {
            evaluation: new mongoose.Types.ObjectId(dto.evaluation),
            title: dto.title,
            formType: dto.formType,
            weight: dto.weight
        };
        return Criterion.create(data);
    }

    async update(id: string, dtoData: UpdateCriterionDTO["data"]): Promise<ICriterion> {
        const updateData: Partial<ICriterion> = {};

        if (dtoData.title) updateData.title = dtoData.title;
        if (dtoData.formType) updateData.formType = dtoData.formType;
        if (dtoData.weight) updateData.weight = dtoData.weight;

        const updated = await Criterion.findByIdAndUpdate(
            new mongoose.Types.ObjectId(id),
            { $set: updateData },
            { new: true }
        ).exec();

        if (!updated) throw new Error("Criterion not found");
        return updated;
    }

    async countDocuments(evaluation: string) {
        return Criterion.countDocuments({ evaluation: new mongoose.Types.ObjectId(evaluation) });
    }

    async delete(id: string) {
        return await Criterion.findByIdAndDelete(id).exec();
    }
}