//result.repository.ts
import mongoose, { FilterQuery } from "mongoose";
import { Result, IResult } from "./result.model";
import { CreateResultDTO, FilterResultsDTO, UpdateResultDTO } from "./result.dto";
import { FilterOptions } from "../../../common/dtos/filter.dto";
import { toObjectId } from "../../../common/utils/mongoose.utils";
import { Reviewer } from "../reviewer.model";

export interface IResultRepository {
    findById(id: string): Promise<IResult | null>;
    find(filters: FilterResultsDTO, options?: FilterOptions): Promise<Partial<IResult>[]>;
    //create(data: CreateResultDTO): Promise<IResult>;
    insertMany(data: CreateResultDTO[]): Promise<IResult[]>;
    update(id: string, data: UpdateResultDTO["data"]): Promise<IResult | null>;
    exists(filters: FilterResultsDTO): Promise<boolean>;
    delete(id: string): Promise<void>;
    deleteByReviewer(reviewerId: string): Promise<number>;
}

// MongoDB implementation
export class ResultRepository implements IResultRepository {
    /**
     * Builds the Mongo query for the Result collection.
     * Returns null when the reviewer-level filters match no reviewer,
     * meaning there can be no results (callers short-circuit).
     */
    private async buildFilter(
        filters: FilterResultsDTO
    ): Promise<FilterQuery<IResult> | null> {
        const query: FilterQuery<IResult> = {};

        if (filters.criterion) {
            query.criterion = toObjectId(filters.criterion);
        }

        // Filters that live on the Reviewer collection
        const hasReviewerLevelFilter =
            filters.application || filters.verification || filters.reviewerStatus;

        // Only a reviewer id: no lookup needed
        if (filters.reviewer && !hasReviewerLevelFilter) {
            query.reviewer = toObjectId(filters.reviewer);
            return query;
        }

        if (hasReviewerLevelFilter) {
            const reviewerFilter: Record<string, any> = {};

            if (filters.reviewer) {
                reviewerFilter._id = toObjectId(filters.reviewer);
            }
            if (filters.application) {
                reviewerFilter.application = toObjectId(filters.application);
            }
            if (filters.verification) {
                reviewerFilter.verification = toObjectId(filters.verification);
            }
            if (filters.reviewerStatus) {
                reviewerFilter.status = filters.reviewerStatus;
            }

            const reviewerIds = await Reviewer.find(reviewerFilter).distinct("_id");
            if (reviewerIds.length === 0) return null;

            query.reviewer = { $in: reviewerIds };
        }

        return query;
    }

    async findById(id: string) {
        return Result.findById(new mongoose.Types.ObjectId(id)).lean<IResult>().exec();
    }

    async find(filters: FilterResultsDTO, options?: FilterOptions) {
        const query = await this.buildFilter(filters);
        if (!query) return [];

        let dbQuery = Result.find(query);

        if (options?.populate) {
            dbQuery = dbQuery.populate("criterion");
        }

        return dbQuery.lean<IResult[]>().exec();
    }

    /*
    async create(dto: CreateResultDTO) {
        const data: Partial<IResult> = {
            reviewer: new mongoose.Types.ObjectId(dto.reviewer),
            criterion: new mongoose.Types.ObjectId(dto.criterion),
            selectedOptions: dto.selectedOptions ? new mongoose.Types.ObjectId(dto.selectedOptions) : undefined,
            score: dto.score ?? null,
            comment: dto.comment
        };
        return Result.create(data);
    }
        */

    async insertMany(dtos: CreateResultDTO[]): Promise<IResult[]> {
        if (!dtos.length) return [];

        const docs = dtos.map(dto => ({
            reviewer: new mongoose.Types.ObjectId(dto.reviewer),
            criterion: new mongoose.Types.ObjectId(dto.criterion),
            //score: dto.score ?? null
        }));

        return Result.insertMany(docs, { ordered: false });
    }

    async update(id: string, dtoData: UpdateResultDTO["data"]): Promise<IResult | null> {
        const updateData: Partial<IResult> = {};

        if (dtoData.score !== undefined) {
            updateData.score = dtoData.score;
        }

        if (dtoData.selectedOptions !== undefined) {
            updateData.selectedOptions = dtoData.selectedOptions.length > 0
                ? dtoData.selectedOptions.map(id => new mongoose.Types.ObjectId(id))
                : [];
        }

        if (dtoData.comment !== undefined) {
            updateData.comment = dtoData.comment;
        }

        return Result.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true }
        ).exec();
    }

    async exists(filters: FilterResultsDTO): Promise<boolean> {
        const query = await this.buildFilter(filters);
        if (!query) return false;

        /*
        if (filters.selectedOption) {
            query.selectedOption = new mongoose.Types.ObjectId(filters.selectedOption);
        }
        */

        const result = await Result.exists(query).exec();
        return result !== null;
    }


    async delete(id: string) {
        await Result.findByIdAndDelete(new mongoose.Types.ObjectId(id)).exec();
    }

    async deleteByReviewer(reviewerId: string): Promise<number> {
        const result = await Result.deleteMany({
            reviewer: new mongoose.Types.ObjectId(reviewerId)
        }).exec();

        return result.deletedCount ?? 0;
    }
}
