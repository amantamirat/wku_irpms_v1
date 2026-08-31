import mongoose from "mongoose";
import { Criterion, ICriterion } from "./criterion.model";
import {
    CreateCriterionDTO,
    FilterCriteriaDTO,
    UpdateCriterionDTO
} from "./criterion.dto";
import { FilterOptions } from "../../../common/dtos/filter.dto";

export interface ICriterionRepository {
    findById(id: string): Promise<ICriterion | null>;
    findOne(filters: FilterCriteriaDTO, options?: FilterOptions): Promise<ICriterion | null>;
    find(filters: FilterCriteriaDTO,options?: FilterOptions): Promise<ICriterion[]>;
    create(dto: CreateCriterionDTO): Promise<ICriterion>;
    createMany(dtos: CreateCriterionDTO[]): Promise<ICriterion[]>;
    update(
        id: string,
        data: UpdateCriterionDTO["data"]
    ): Promise<ICriterion | null>;
    delete(id: string): Promise<ICriterion | null>;
    deleteByEvaluation(evaluationId: string): Promise<any>;
}

export class CriterionRepository implements ICriterionRepository {

    // ==================================================
    // BUILD FILTER
    // ==================================================

    private buildFilter(filters: FilterCriteriaDTO) {
        const query: Record<string, unknown> = {};

        if (filters.evaluation) {
            query.evaluation =
                new mongoose.Types.ObjectId(filters.evaluation);
        }

        if (filters.title) {
            query.title = filters.title;
        }

        if (filters.formType) {
            query.formType = filters.formType;
        }

        return query;
    }

    // ==================================================
    // FIND BY ID
    // ==================================================

    async findById(id: string): Promise<ICriterion | null> {
        return Criterion.findById(
            new mongoose.Types.ObjectId(id)
        )
            .lean<ICriterion>()
            .exec();
    }

    // ==================================================
    // FIND ONE
    // ==================================================

    async findOne(
        filters: FilterCriteriaDTO, options?: FilterOptions
    ): Promise<ICriterion | null> {

        const query = this.buildFilter(filters);

        let dbQuery = Criterion.findOne(query);

        if (options?.populate) {
            dbQuery = dbQuery.populate("evaluation");
        }

        return dbQuery
            .lean<ICriterion>()
            .exec();
    }

    // ==================================================
    // FIND MANY
    // ==================================================

    async find(
        filters: FilterCriteriaDTO, options?: FilterOptions
    ): Promise<ICriterion[]> {

        const query = this.buildFilter(filters);

        let dbQuery = Criterion.find(query);

        if (options?.populate) {
            dbQuery = dbQuery.populate("evaluation");
        }

        // Always sort by order so the form
        // renders criteria in the correct sequence.
        return dbQuery
            .sort({ order: 1 })
            .lean<ICriterion[]>()
            .exec();
    }

    // ==================================================
    // CREATE
    // ==================================================

    async create(
        dto: CreateCriterionDTO
    ): Promise<ICriterion> {

        const data: Partial<ICriterion> = {
            evaluation:
                new mongoose.Types.ObjectId(dto.evaluation),

            title: dto.title,

            formType: dto.formType,

            weight: dto.weight,

            order: dto.order ?? 0,

            options: dto.options || [],

            isRequired: dto.isRequired ?? true
        };

        return Criterion.create(data);
    }

    // ==================================================
    // CREATE MANY
    // ==================================================

    async createMany(
        dtos: CreateCriterionDTO[]
    ): Promise<ICriterion[]> {

        const preparedData = dtos.map((dto, index) => ({
            evaluation:
                new mongoose.Types.ObjectId(dto.evaluation),

            title: dto.title,

            formType: dto.formType,

            weight: dto.weight,

            options: dto.options || [],

            order: dto.order ?? index,

            isRequired: dto.isRequired ?? true
        }));

        return Criterion.insertMany(preparedData);
    }

    // ==================================================
    // UPDATE
    // ==================================================

    async update(
        id: string,
        dtoData: UpdateCriterionDTO["data"]
    ): Promise<ICriterion | null> {

        return Criterion.findByIdAndUpdate(
            new mongoose.Types.ObjectId(id),
            {
                $set: dtoData
            },
            {
                new: true,
                runValidators: true
            }
        ).exec();
    }

    // ==================================================
    // DELETE BY EVALUATION
    // ==================================================

    /**
     * Deletes all criteria associated with a specific evaluation.
     *
     * Useful when deleting an evaluation or resetting
     * its criteria configuration.
     */
    async deleteByEvaluation(
        evaluationId: string
    ) {

        return Criterion.deleteMany({
            evaluation:
                new mongoose.Types.ObjectId(evaluationId)
        }).exec();
    }

    // ==================================================
    // DELETE
    // ==================================================

    async delete(
        id: string
    ): Promise<ICriterion | null> {

        return Criterion.findByIdAndDelete(
            new mongoose.Types.ObjectId(id)
        ).exec();
    }
}