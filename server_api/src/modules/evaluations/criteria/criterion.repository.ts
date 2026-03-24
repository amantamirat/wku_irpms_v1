import mongoose from "mongoose";
import { Criterion, ICriterion } from "./criterion.model";
import {
    CreateCriterionDTO,
    GetCriteriaDTO,
    UpdateCriterionDTO
} from "./criterion.dto";

export interface ICriterionRepository {
    findById(id: string): Promise<ICriterion | null>;
    find(filters: GetCriteriaDTO): Promise<ICriterion[]>;
    create(dto: CreateCriterionDTO): Promise<ICriterion>;
    createMany(dtos: CreateCriterionDTO[]): Promise<ICriterion[]>;
    update(id: string, data: UpdateCriterionDTO["data"]): Promise<ICriterion | null>;
    //countDocuments(evaluation: string): Promise<number>;
    delete(id: string): Promise<ICriterion | null>;
    deleteByEvaluation(evaluationId: string): Promise<any>; // Added this
}

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

        let dbQuery = Criterion.find(query);

        if (filters.populate) {
            dbQuery = dbQuery.populate("evaluation");
        }

        // ✅ Always sort by 'order' so the form renders correctly
        return dbQuery.sort({ order: 1 }).lean<ICriterion[]>().exec();
    }

    async create(dto: CreateCriterionDTO) {
        // ✅ Map the full DTO including embedded options and order
        const data: Partial<ICriterion> = {
            evaluation: new mongoose.Types.ObjectId(dto.evaluation),
            title: dto.title,
            formType: dto.formType,
            weight: dto.weight,
            order: dto.order ?? 0,
            options: dto.options || [], // Handles the merged options
            isRequired: dto.isRequired ?? true
        };
        return Criterion.create(data);
    }

    async createMany(dtos: CreateCriterionDTO[]): Promise<ICriterion[] | any> {
        const preparedData = dtos.map((dto, index) => ({
            evaluation: new mongoose.Types.ObjectId(dto.evaluation),
            title: dto.title,
            formType: dto.formType,
            weight: dto.weight,
            options: dto.options || [],
            order: dto.order ?? index,
            isRequired: dto.isRequired ?? true
        }));

        // insertMany returns an array of the created documents
        return Criterion.insertMany(preparedData);
    }

    async update(id: string, dtoData: UpdateCriterionDTO["data"]): Promise<ICriterion | null> {
        // Use $set to update only the provided fields from the Partial DTO
        // This naturally handles the options array if it's provided in the update
        return Criterion.findByIdAndUpdate(
            new mongoose.Types.ObjectId(id),
            { $set: dtoData },
            { new: true, runValidators: true }
        ).exec();
    }
    /*
    async countDocuments(evaluation: string) {
        return Criterion.countDocuments({
            evaluation: new mongoose.Types.ObjectId(evaluation)
        }).exec();
    }
    */

    /**
         * Deletes all criteria associated with a specific evaluation.
         * Useful for cascading deletes or resetting evaluation setup.
         */
    async deleteByEvaluation(evaluationId: string) {
        return Criterion.deleteMany({
            evaluation: new mongoose.Types.ObjectId(evaluationId)
        }).exec();
    }

    async delete(id: string) {
        return Criterion.findByIdAndDelete(new mongoose.Types.ObjectId(id)).exec();
    }
}